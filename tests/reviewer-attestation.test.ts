import { generateKeyPairSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { HumanReview } from "../src/donecheck-core";
import {
  signHumanReviewAttestation,
  verifyHumanReviewAttestation,
} from "../src/donecheck-runtime-node";

const review: HumanReview = {
  id: "review-auth-1",
  taskId: "task-auth-1",
  verificationResultId: "verification-auth-1",
  decision: "accepted",
  reason: "Evidence is sufficient.",
  reviewerId: "reviewer-1",
  reviewedAt: "2026-09-22T10:10:00Z",
};

function keys() {
  const pair = generateKeyPairSync("ed25519");
  return {
    publicKeyPem: pair.publicKey.export({ type: "spki", format: "pem" }).toString(),
    privateKeyPem: pair.privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
  };
}

describe("DoneCheck reviewer attestation", () => {
  it("authenticates an authorized reviewer signature", () => {
    const { publicKeyPem, privateKeyPem } = keys();
    const attestation = signHumanReviewAttestation(review, {
      reviewerId: review.reviewerId,
      keyId: "reviewer-1-key-2026",
      privateKeyPem,
      signedAt: "2026-09-22T10:10:01Z",
    });

    const result = verifyHumanReviewAttestation(review, attestation, {
      reviewerId: review.reviewerId,
      keyId: "reviewer-1-key-2026",
      publicKeyPem,
      allowedDecisions: ["accepted"],
    });

    expect(result).toEqual({ valid: true });
  });

  it("rejects review tampering after signing", () => {
    const { publicKeyPem, privateKeyPem } = keys();
    const attestation = signHumanReviewAttestation(review, {
      reviewerId: review.reviewerId,
      keyId: "reviewer-1-key-2026",
      privateKeyPem,
      signedAt: "2026-09-22T10:10:01Z",
    });

    const result = verifyHumanReviewAttestation(
      { ...review, reason: "Changed after signature." },
      attestation,
      {
        reviewerId: review.reviewerId,
        keyId: "reviewer-1-key-2026",
        publicKeyPem,
        allowedDecisions: ["accepted"],
      },
    );

    expect(result.valid).toBe(false);
  });

  it("rejects a reviewer that lacks authority for the decision", () => {
    const { publicKeyPem, privateKeyPem } = keys();
    const attestation = signHumanReviewAttestation(review, {
      reviewerId: review.reviewerId,
      keyId: "reviewer-1-key-2026",
      privateKeyPem,
      signedAt: "2026-09-22T10:10:01Z",
    });

    const result = verifyHumanReviewAttestation(review, attestation, {
      reviewerId: review.reviewerId,
      keyId: "reviewer-1-key-2026",
      publicKeyPem,
      allowedDecisions: ["revise"],
    });

    expect(result.valid).toBe(false);
  });
});
