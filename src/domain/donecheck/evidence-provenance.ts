import type { IsoDateTime } from "./ids";

export type EvidenceProducerKind =
  "github_ci" | "playwright" | "langsmith" | "braintrust" | "mac_engineer" | "custom";

export const EVIDENCE_PRODUCER_KINDS: EvidenceProducerKind[] = [
  "github_ci",
  "playwright",
  "langsmith",
  "braintrust",
  "mac_engineer",
  "custom",
];

export interface EvidenceProvenance {
  schema: "donecheck.evidence-provenance/v1";
  producerKind: EvidenceProducerKind;
  producerId: string;
  executionId: string;
  artifactDigest: string;
  observedAt: IsoDateTime;
  verificationRef?: string;
}
