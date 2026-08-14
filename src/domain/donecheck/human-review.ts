import type { HumanReviewId, IsoDateTime, TaskId, VerificationResultId } from "./ids";
export type HumanDecision = "accepted" | "revise" | "rejected";
export const HUMAN_DECISIONS: HumanDecision[] = ["accepted", "revise", "rejected"];
export interface HumanReview { id: HumanReviewId; taskId: TaskId; verificationResultId: VerificationResultId; decision: HumanDecision; reason: string; reviewerId: string; reviewedAt: IsoDateTime; }
