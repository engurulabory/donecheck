import { createHash } from "node:crypto";
import { mkdir, open, readFile, unlink } from "node:fs/promises";
import { dirname } from "node:path";
import { canonicalJson, type JsonValue } from "./canonical-json";

export interface AuditEvent {
  id: string;
  type: string;
  actorId: string;
  payload: JsonValue;
  occurredAt: string;
}

export interface AuditRecord {
  sequence: number;
  previousHash: string | null;
  event: AuditEvent;
  hash: string;
}

export type AuditLedgerVerification =
  | { valid: true; records: AuditRecord[]; headHash: string | null }
  | { valid: false; records: AuditRecord[]; reason: string };

const HASH_PREFIX = "sha256:";
const ISO_DATE_TIME =
  /^\d{4}-\d{2}-\d{2}[Tt]\d{2}:\d{2}:\d{2}(\.\d+)?([Zz]|[+-]\d{2}:\d{2})$/;

function hashRecord(sequence: number, previousHash: string | null, event: AuditEvent): string {
  const material = canonicalJson({ sequence, previousHash, event });
  return HASH_PREFIX + createHash("sha256").update(material, "utf8").digest("hex");
}

function validateEvent(event: AuditEvent): void {
  if (!event.id.trim()) throw new Error("Audit event id is required.");
  if (!event.type.trim()) throw new Error("Audit event type is required.");
  if (!event.actorId.trim()) throw new Error("Audit actorId is required.");
  if (!ISO_DATE_TIME.test(event.occurredAt) || Number.isNaN(Date.parse(event.occurredAt))) {
    throw new Error("Audit occurredAt must be a valid ISO-8601 date-time.");
  }
  canonicalJson(event.payload);
}

async function readRecords(path: string): Promise<AuditRecord[]> {
  let content: string;
  try {
    content = await readFile(path, "utf8");
  } catch (error) {
    if ((error as { code?: string }).code === "ENOENT") return [];
    throw error;
  }

  const lines = content.split("\n").filter((line) => line.trim().length > 0);
  return lines.map((line, index) => {
    try {
      return JSON.parse(line) as AuditRecord;
    } catch {
      throw new Error(`Audit ledger contains invalid JSON at line ${index + 1}.`);
    }
  });
}

export async function verifyAuditLedger(path: string): Promise<AuditLedgerVerification> {
  let records: AuditRecord[];
  try {
    records = await readRecords(path);
  } catch (error) {
    return {
      valid: false,
      records: [],
      reason: error instanceof Error ? error.message : "Audit ledger could not be read.",
    };
  }

  let previousHash: string | null = null;
  const ids = new Set<string>();

  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];
    const expectedSequence = index + 1;
    if (record.sequence !== expectedSequence) {
      return { valid: false, records, reason: `Invalid sequence at record ${expectedSequence}.` };
    }
    if (record.previousHash !== previousHash) {
      return {
        valid: false,
        records,
        reason: `Broken previousHash link at record ${expectedSequence}.`,
      };
    }
    try {
      validateEvent(record.event);
    } catch (error) {
      return {
        valid: false,
        records,
        reason: error instanceof Error ? error.message : "Invalid audit event.",
      };
    }
    if (ids.has(record.event.id)) {
      return { valid: false, records, reason: `Duplicate audit event id: ${record.event.id}.` };
    }
    ids.add(record.event.id);

    const expectedHash = hashRecord(record.sequence, record.previousHash, record.event);
    if (record.hash !== expectedHash) {
      return { valid: false, records, reason: `Hash mismatch at record ${expectedSequence}.` };
    }
    previousHash = record.hash;
  }

  return { valid: true, records, headHash: previousHash };
}

async function withLock<T>(lockPath: string, work: () => Promise<T>): Promise<T> {
  await mkdir(dirname(lockPath), { recursive: true });
  let lockHandle: Awaited<ReturnType<typeof open>> | undefined;

  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      lockHandle = await open(lockPath, "wx");
      break;
    } catch (error) {
      if ((error as { code?: string }).code !== "EEXIST") throw error;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  if (!lockHandle) throw new Error("Audit ledger lock could not be acquired.");

  try {
    return await work();
  } finally {
    await lockHandle.close();
    await unlink(lockPath).catch(() => undefined);
  }
}

export class JsonlAuditLedger {
  constructor(public readonly path: string) {}

  async append(event: AuditEvent): Promise<AuditRecord> {
    validateEvent(event);
    const lockPath = `${this.path}.lock`;

    return withLock(lockPath, async () => {
      await mkdir(dirname(this.path), { recursive: true });
      const verification = await verifyAuditLedger(this.path);
      if (!verification.valid) {
        throw new Error(`Audit ledger integrity failure: ${verification.reason}`);
      }
      if (verification.records.some((record) => record.event.id === event.id)) {
        throw new Error(`Duplicate audit event id: ${event.id}.`);
      }

      const sequence = verification.records.length + 1;
      const previousHash = verification.headHash;
      const record: AuditRecord = {
        sequence,
        previousHash,
        event,
        hash: hashRecord(sequence, previousHash, event),
      };

      const handle = await open(this.path, "a");
      try {
        await handle.writeFile(`${canonicalJson(record)}\n`, "utf8");
        await handle.sync();
      } finally {
        await handle.close();
      }
      return record;
    });
  }

  verify(): Promise<AuditLedgerVerification> {
    return verifyAuditLedger(this.path);
  }
}
