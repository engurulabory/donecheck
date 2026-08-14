import type { EvidenceId, IsoDateTime, SuccessCriterionId, TaskId } from "./ids";
export type EvidenceKind = "text" | "link" | "file" | "log" | "test_report";
export const EVIDENCE_KINDS: EvidenceKind[] = ["text", "link", "file", "log", "test_report"];
export type EvidenceSource = "human" | "ai" | "system";
export const EVIDENCE_SOURCES: EvidenceSource[] = ["human", "ai", "system"];
export interface Evidence {
  id: EvidenceId;
  taskId: TaskId;
  criterionId?: SuccessCriterionId;
  kind: EvidenceKind;
  source: EvidenceSource;
  content: string;
  collectedAt: IsoDateTime;
}
