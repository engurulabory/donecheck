import type { HumanReview } from "./human-review";
import { validateHumanReview } from "./human-review-validation";
import type { VerificationResult } from "./verification-result";
import { validateVerificationResult } from "./verification-result-validation";
export type HumanReviewTransition = { verificationResult: VerificationResult; review: HumanReview; decision: HumanReview["decision"]; humanOverride: boolean; };
export class HumanReviewTransitionError extends Error { constructor(public readonly code: "INVALID_VERIFICATION_RESULT" | "INVALID_HUMAN_REVIEW" | "REFERENCE_MISMATCH", message: string) { super(message); this.name = "HumanReviewTransitionError"; } }
export function transitionToHumanDecision(verificationResultInput: unknown, humanReviewInput: unknown): HumanReviewTransition {
  const resultValidation = validateVerificationResult(verificationResultInput); if (!resultValidation.valid) throw new HumanReviewTransitionError("INVALID_VERIFICATION_RESULT", "VerificationResult failed runtime validation.");
  const reviewValidation = validateHumanReview(humanReviewInput); if (!reviewValidation.valid) throw new HumanReviewTransitionError("INVALID_HUMAN_REVIEW", "HumanReview failed runtime validation.");
  const verificationResult = resultValidation.result; const review = reviewValidation.review;
  if (review.taskId !== verificationResult.taskId || review.verificationResultId !== verificationResult.id) throw new HumanReviewTransitionError("REFERENCE_MISMATCH", "HumanReview references do not match the reviewed VerificationResult.");
  return { verificationResult: { ...verificationResult, criteria: verificationResult.criteria.map((item) => ({ ...item, evidenceIds: [...item.evidenceIds] })) }, review: { ...review }, decision: review.decision, humanOverride: (verificationResult.outcome === "pass" && review.decision !== "accepted") || (verificationResult.outcome !== "pass" && review.decision === "accepted") };
}
