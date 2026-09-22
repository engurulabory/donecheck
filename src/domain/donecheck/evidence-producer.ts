import type { Evidence, EvidenceKind } from "./evidence";
import type { EvidenceProvenance, EvidenceProducerKind } from "./evidence-provenance";
import { validateEvidence } from "./evidence-validation";

export interface ProducerEvidenceInput {
  id: string;
  taskId: string;
  criterionId: string;
  kind: Extract<EvidenceKind, "log" | "test_report">;
  content: string;
  collectedAt: string;
  producerKind: EvidenceProducerKind;
  producerId: string;
  executionId: string;
  artifactDigest: string;
  observedAt: string;
  verificationRef?: string;
}

export class EvidenceProducerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EvidenceProducerError";
  }
}

/**
 * Normalizes an external verification producer into DoneCheck system evidence.
 *
 * This adapter records provenance; it does not authenticate the producer itself.
 * Authentication/authorization remains the responsibility of the integration boundary.
 */
export function createProducerEvidence(input: ProducerEvidenceInput): Evidence {
  const provenance: EvidenceProvenance = {
    schema: "donecheck.evidence-provenance/v1",
    producerKind: input.producerKind,
    producerId: input.producerId,
    executionId: input.executionId,
    artifactDigest: input.artifactDigest,
    observedAt: input.observedAt,
    ...(input.verificationRef ? { verificationRef: input.verificationRef } : {}),
  };

  const evidence: Evidence = {
    id: input.id,
    taskId: input.taskId,
    criterionId: input.criterionId,
    kind: input.kind,
    source: "system",
    content: input.content,
    collectedAt: input.collectedAt,
    provenance,
  };

  const validated = validateEvidence(evidence);
  if (!validated.valid) {
    throw new EvidenceProducerError(
      `Producer evidence failed validation: ${validated.issues
        .map((issue) => `${issue.path}: ${issue.message}`)
        .join("; ")}`,
    );
  }

  return validated.evidence;
}
