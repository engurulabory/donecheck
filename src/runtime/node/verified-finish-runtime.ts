import type { HumanReview, VerificationResult } from "../../domain/donecheck";
import { transitionToHumanDecision } from "../../domain/donecheck";
import { JsonlAuditLedger } from "./audit-ledger";
import type { ReviewerAttestation, ReviewerAuthority } from "./reviewer-attestation";
import { verifyHumanReviewAttestation } from "./reviewer-attestation";

export interface VerifiedFinishInput {
  verificationResult: VerificationResult;
  review: HumanReview;
  attestation: ReviewerAttestation;
  authority: ReviewerAuthority;
  ledger: JsonlAuditLedger;
  finishId: string;
}

export interface VerifiedFinishReceipt {
  schema: "donecheck.verified-finish/v1";
  finishId: string;
  taskId: string;
  verificationResultId: string;
  reviewerId: string;
  auditHeadHash: string;
}

export async function recordVerifiedFinish(
  input: VerifiedFinishInput,
): Promise<VerifiedFinishReceipt> {
  const attestation = verifyHumanReviewAttestation(
    input.review,
    input.attestation,
    input.authority,
  );
  if (!attestation.valid) {
    throw new Error(`Reviewer authorization failed: ${attestation.reason}`);
  }

  const transition = transitionToHumanDecision(input.verificationResult, input.review);
  if (transition.verificationResult.outcome !== "pass") {
    throw new Error("Verified Finish requires automated verification outcome pass.");
  }
  if (transition.decision !== "accepted") {
    throw new Error("Verified Finish requires final human decision accepted.");
  }

  await input.ledger.append({
    id: `${input.finishId}:human-review`,
    type: "human_review_authorized",
    actorId: input.review.reviewerId,
    occurredAt: input.attestation.signedAt,
    payload: {
      taskId: input.review.taskId,
      verificationResultId: input.review.verificationResultId,
      decision: input.review.decision,
      keyId: input.attestation.keyId,
      scheme: input.attestation.scheme,
    },
  });

  const finalRecord = await input.ledger.append({
    id: input.finishId,
    type: "verified_finish",
    actorId: input.review.reviewerId,
    occurredAt: input.review.reviewedAt,
    payload: {
      taskId: input.review.taskId,
      verificationResultId: input.review.verificationResultId,
      humanOverride: transition.humanOverride,
    },
  });

  return {
    schema: "donecheck.verified-finish/v1",
    finishId: input.finishId,
    taskId: input.review.taskId,
    verificationResultId: input.review.verificationResultId,
    reviewerId: input.review.reviewerId,
    auditHeadHash: finalRecord.hash,
  };
}
