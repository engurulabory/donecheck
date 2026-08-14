import { z } from "zod";
import type { Evidence } from "./evidence";
import { EVIDENCE_KINDS, EVIDENCE_SOURCES } from "./evidence";
const nonEmpty = (field: string) => z.string({ required_error: `${field} is required`, invalid_type_error: `${field} must be a string` }).trim().min(1, { message: `${field} must not be empty` });
const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}[Tt]\d{2}:\d{2}:\d{2}(\.\d+)?([Zz]|[+-]\d{2}:\d{2})$/;
const isoDateTime = nonEmpty("collectedAt").refine((value) => ISO_DATE_TIME.test(value) && !Number.isNaN(Date.parse(value)), { message: "collectedAt must be a valid ISO-8601 date-time" });
export const evidenceSchema = z.object({
  id: nonEmpty("id"), taskId: nonEmpty("taskId"), criterionId: nonEmpty("criterionId").optional(),
  kind: z.enum(EVIDENCE_KINDS as [string, ...string[]], { errorMap: () => ({ message: "kind is not supported" }) }),
  source: z.enum(EVIDENCE_SOURCES as [string, ...string[]], { errorMap: () => ({ message: "source is not supported" }) }),
  content: nonEmpty("content"), collectedAt: isoDateTime,
});
export type EvidenceValidationIssue = { path: string; message: string };
export type EvidenceValidationResult = { valid: true; evidence: Evidence } | { valid: false; issues: EvidenceValidationIssue[] };
export function validateEvidence(input: unknown): EvidenceValidationResult { const parsed = evidenceSchema.safeParse(input); if (parsed.success) return { valid: true, evidence: parsed.data as Evidence }; return { valid: false, issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })) }; }
export function isValidEvidence(input: unknown): input is Evidence { return evidenceSchema.safeParse(input).success; }
