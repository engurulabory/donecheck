import type { SuccessCriterionId, TaskId } from "./ids";
export type CriterionKind = "objective" | "subjective";
export const CRITERION_KINDS: CriterionKind[] = ["objective", "subjective"];
export interface SuccessCriterion {
  id: SuccessCriterionId;
  taskId: TaskId;
  statement: string;
  verificationInstruction: string;
  kind: CriterionKind;
  required: boolean;
}
