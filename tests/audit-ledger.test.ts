import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { JsonlAuditLedger, verifyAuditLedger } from "../src/donecheck-runtime-node";

const dirs: string[] = [];
afterEach(async () => {
  await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("DoneCheck durable audit ledger", () => {
  it("persists a hash-chained ledger and verifies it after reopen", async () => {
    const dir = await mkdtemp(join(tmpdir(), "donecheck-audit-"));
    dirs.push(dir);
    const path = join(dir, "audit.jsonl");
    const ledger = new JsonlAuditLedger(path);

    const first = await ledger.append({
      id: "event-1",
      type: "verification",
      actorId: "system",
      occurredAt: "2026-09-22T10:00:00Z",
      payload: { outcome: "pass" },
    });
    const second = await ledger.append({
      id: "event-2",
      type: "human_review",
      actorId: "reviewer-1",
      occurredAt: "2026-09-22T10:01:00Z",
      payload: { decision: "accepted" },
    });

    expect(first.sequence).toBe(1);
    expect(second.sequence).toBe(2);
    expect(second.previousHash).toBe(first.hash);
    expect(second.hash).toMatch(/^sha256:[a-f0-9]{64}$/);

    const reopened = await verifyAuditLedger(path);
    expect(reopened.valid).toBe(true);
    if (reopened.valid) {
      expect(reopened.records).toHaveLength(2);
      expect(reopened.headHash).toBe(second.hash);
    }
  });

  it("detects payload tampering after persistence", async () => {
    const dir = await mkdtemp(join(tmpdir(), "donecheck-audit-"));
    dirs.push(dir);
    const path = join(dir, "audit.jsonl");
    const ledger = new JsonlAuditLedger(path);

    await ledger.append({
      id: "event-1",
      type: "verification",
      actorId: "system",
      occurredAt: "2026-09-22T10:00:00Z",
      payload: { outcome: "pass" },
    });

    const content = await readFile(path, "utf8");
    await writeFile(path, content.replace('"pass"', '"fail"'), "utf8");

    const verification = await verifyAuditLedger(path);
    expect(verification.valid).toBe(false);
    if (!verification.valid) expect(verification.reason).toContain("Hash mismatch");
  });

  it("rejects duplicate event identities", async () => {
    const dir = await mkdtemp(join(tmpdir(), "donecheck-audit-"));
    dirs.push(dir);
    const path = join(dir, "audit.jsonl");
    const ledger = new JsonlAuditLedger(path);

    const event = {
      id: "event-duplicate",
      type: "verification",
      actorId: "system",
      occurredAt: "2026-09-22T10:00:00Z",
      payload: { digest: createHash("sha256").update("artifact").digest("hex") },
    } as const;

    await ledger.append(event);
    await expect(ledger.append(event)).rejects.toThrow("Duplicate audit event id");
  });
});
