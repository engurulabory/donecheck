import { Buffer } from "node:buffer";
import {
  createPrivateKey,
  createPublicKey,
  sign as signBytes,
  verify as verifyBytes,
} from "node:crypto";
import type { HumanDecision, HumanReview } from "../../domain/donecheck";
import { validateHumanReview } from "../../domain/donecheck";
import { canonicalJson } from "./canonical-json";

export interface ReviewerAuthority {
  reviewerId: string;
  keyId: string;
  publicKeyPem: string;
  allowedDecisions?: HumanDecision[];
}

export interface ReviewerAttestation {
  scheme: "ed25519";
  reviewerId: string;
  keyId: string;
  signedAt: string;
  signatureBase64: string;
}

export type ReviewerAttestationVerification =
  | { valid: true }
  | { valid: false; reason: string };

const ISO_DATE_TIME =
  /^\d{4}-\d{2}-\d{2}[Tt]\d{2}:\d{2}:\d{2}(\.\d+)?([Zz]|[+-]\d{2}:\d{2})$/;

export function humanReviewSigningPayload(review: HumanReview, signedAt: string): string {
  return canonicalJson({
    schema: "donecheck.reviewer-attestation/v1",
    signedAt,
    review,
  });
}

export function signHumanReviewAttestation(
  review: HumanReview,
  input: { reviewerId: string; keyId: string; privateKeyPem: string; signedAt: string },
): ReviewerAttestation {
  const validation = validateHumanReview(review);
  if (!validation.valid) throw new Error("HumanReview failed runtime validation.");
  if (review.reviewerId !== input.reviewerId) {
    throw new Error("Reviewer identity does not match the HumanReview reviewerId.");
  }
  if (!ISO_DATE_TIME.test(input.signedAt) || Number.isNaN(Date.parse(input.signedAt))) {
    throw new Error("signedAt must be a valid ISO-8601 date-time.");
  }

  const payload = humanReviewSigningPayload(review, input.signedAt);
  const signature = signBytes(null, Buffer.from(payload, "utf8"), createPrivateKey(input.privateKeyPem));
  return {
    scheme: "ed25519",
    reviewerId: input.reviewerId,
    keyId: input.keyId,
    signedAt: input.signedAt,
    signatureBase64: signature.toString("base64"),
  };
}

export function verifyHumanReviewAttestation(
  review: HumanReview,
  attestation: ReviewerAttestation,
  authority: ReviewerAuthority,
): ReviewerAttestationVerification {
  const validation = validateHumanReview(review);
  if (!validation.valid) return { valid: false, reason: "HumanReview failed runtime validation." };
  if (attestation.scheme !== "ed25519") {
    return { valid: false, reason: "Unsupported reviewer attestation scheme." };
  }
  if (
    review.reviewerId !== authority.reviewerId ||
    attestation.reviewerId !== authority.reviewerId
  ) {
    return { valid: false, reason: "Reviewer identity mismatch." };
  }
  if (attestation.keyId !== authority.keyId) {
    return { valid: false, reason: "Reviewer keyId mismatch." };
  }
  if (
    !ISO_DATE_TIME.test(attestation.signedAt) ||
    Number.isNaN(Date.parse(attestation.signedAt))
  ) {
    return { valid: false, reason: "Attestation signedAt is invalid." };
  }
  if (
    authority.allowedDecisions &&
    !authority.allowedDecisions.includes(review.decision)
  ) {
    return { valid: false, reason: "Reviewer is not authorized for this decision." };
  }

  let signature: Buffer;
  try {
    signature = Buffer.from(attestation.signatureBase64, "base64");
    if (signature.length === 0) return { valid: false, reason: "Reviewer signature is empty." };
  } catch {
    return { valid: false, reason: "Reviewer signature is malformed." };
  }

  const payload = humanReviewSigningPayload(review, attestation.signedAt);
  try {
    const valid = verifyBytes(
      null,
      Buffer.from(payload, "utf8"),
      createPublicKey(authority.publicKeyPem),
      signature,
    );
    return valid ? { valid: true } : { valid: false, reason: "Reviewer signature is invalid." };
  } catch {
    return { valid: false, reason: "Reviewer public key or signature could not be verified." };
  }
}
