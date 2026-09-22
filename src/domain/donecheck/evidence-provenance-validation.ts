import { z } from "zod";
import type { EvidenceProvenance } from "./evidence-provenance";
import { EVIDENCE_PRODUCER_KINDS } from "./evidence-provenance";

const nonEmpty = (field: string) =>
  z
    .string({
      required_error: `${field} is required`,
      invalid_type_error: `${field} must be a string`,
    })
    .trim()
    .min(1, { message: `${field} must not be empty` });

const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}[Tt]\d{2}:\d{2}:\d{2}(\.\d+)?([Zz]|[+-]\d{2}:\d{2})$/;
const SHA256_DIGEST = /^sha256:[a-fA-F0-9]{64}$/;

const isoDateTime = nonEmpty("observedAt").refine(
  (value) => ISO_DATE_TIME.test(value) && !Number.isNaN(Date.parse(value)),
  { message: "observedAt must be a valid ISO-8601 date-time" },
);

export const evidenceProvenanceSchema = z.object({
  schema: z.literal("donecheck.evidence-provenance/v1"),
  producerKind: z.enum(EVIDENCE_PRODUCER_KINDS as [string, ...string[]], {
    errorMap: () => ({ message: "producerKind is not supported" }),
  }),
  producerId: nonEmpty("producerId"),
  executionId: nonEmpty("executionId"),
  artifactDigest: nonEmpty("artifactDigest").refine((value) => SHA256_DIGEST.test(value), {
    message: "artifactDigest must use sha256:<64 hex characters>",
  }),
  observedAt: isoDateTime,
  verificationRef: nonEmpty("verificationRef").optional(),
});

export type EvidenceProvenanceValidationResult =
  | { valid: true; provenance: EvidenceProvenance }
  | { valid: false; issues: { path: string; message: string }[] };

export function validateEvidenceProvenance(input: unknown): EvidenceProvenanceValidationResult {
  const parsed = evidenceProvenanceSchema.safeParse(input);
  if (parsed.success) {
    return { valid: true, provenance: parsed.data as EvidenceProvenance };
  }
  return {
    valid: false,
    issues: parsed.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  };
}
