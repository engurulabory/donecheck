import { generateKeyPairSync } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { HumanReview, VerificationResult } from "../src/donecheck-core";
import {
  JsonlAuditLedger,
  recordVerifiedFinish,
  signHumanReviewAttestation,
} from "../src/donecheck-runtime-node";

const dirs: string[] = [];
afterEach(async () => {
  await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

const result: VerificationResult = {
  id: "verification-finish-1",
  taskId: "task-finish-1",
  outcome: "pass",
  reason: "All required criteria passed.",
  criteria: [
    {
      criterionId: "criterion-finish-1",
      outcome: "pass",
      reason: "Trusted system evidence contains an explicit DoneCheck PASS assertion.",
      evidenceIds: ["evidence-finish-1"],
    },
  ],
  verifiedAt: "2026-09-22T10:20:00Z",
};

const review: HumanReview = {
  id: "review-finish-1",
  taskId: result.taskId,
  verificationResultId: result.id,
  decision: "accepted",
  reason: "Verified evidence accepted.",
  reviewerId: "reviewer-finish-1",
  reviewedAt: "2026-09-22T10:21:00Z",
};

function keyPair() {
  const pair = generateKeyPairSync("ed25519");
  return {
    publicKeyPem: pair.publicKey.export({ type: "spki", format: "pem" }).toString(),
    privateKeyPem: pair.privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
  };
}

describe("DoneCheck Verified Finish runtime", () => {
  it("produces a durable receipt only after pass + authorized human acceptance", async () => {
    const dir = await mkdtemp(join(tmpdir(), "donecheck-finish-"));
    dirs.push(dir);
    const ledger = new JsonlAuditLedger(join(dir, "audit.jsonl"));
    const { publicKeyPem, privateKeyPem } = keyPair();

    const attestation = signHumanReviewAttestation(review, {
      reviewerId: review.reviewerId,
      keyId: "reviewer-finish-key",
      privateKeyPem,
      signedAt: "2026-09-22T10:21:01Z",
    });

    const receipt = await recordVerifiedFinish({
      verificationResult: result,
      review,
      attestation,
      authority: {
        reviewerId: review.reviewerId,
        keyId: "reviewer-finish-key",
        publicKeyPem,
        allowedDecisions: ["accepted"],
      },
      ledger,
      finishId: "finish-1",
    });

    expect(receipt.schema).toBe("donecheck.verified-finish/v1");
    expect(receipt.auditHeadHash).toMatch(/^sha256:[a-f0-9]{64}$/);

    const verified = await ledger.verify();
    expect(verified.valid).toBe(true);
    if (verified.valid) {
      expect(verified.records.map((item) => item.event.type)).toEqual([
        "human_review_authorized",
        "verified_finish",
      ]);
    }
  });

  it("rejects finish when automated verification is not pass", async () => {
    const dir = await mkdtemp(join(tmpdir(), "donecheck-finish-"));
    dirs.push(dir);
    const ledger = new JsonlAuditLedger(join(dir, "audit.jsonl"));
    const { publicKeyPem, privateKeyPem } = keyPair();
    const attestation = signHumanReviewAttestation(review, {
      reviewerId: review.reviewerId,
      keyId: "reviewer-finish-key",
      privateKeyPem,
      signedAt: "2026-09-22T10:21:01Z",
    });

    await expect(
      recordVerifiedFinish({
        verificationResult: { ...result, outcome: "inconclusive" },
        review,
        attestation,
        authority: {
          reviewerId: review.reviewerId,
          keyId: "reviewer-finish-key",
          publicKeyPem,
          allowedDecisions: ["accepted"],
        },
        ledger,
        finishId: "finish-2",
      }),
    ).rejects.toThrow("requires automated verification outcome pass");
  });
});
