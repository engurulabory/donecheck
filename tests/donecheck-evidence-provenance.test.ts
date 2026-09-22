import { describe, expect, it } from "vitest";
import {
  createProducerEvidence,
  EvidenceProducerError,
  type Evidence,
  type EvidenceProducerKind,
  type SuccessCriterion,
  type Task,
  validateEvidenceProvenance,
  verifyTask,
} from "../src/donecheck-core";

const task: Task = {
  id: "task-provenance",
  title: "Verify evidence producer provenance",
  requestText: "Accept machine assertions only from explicitly trusted producer records.",
  status: "awaiting_review",
  createdAt: "2026-09-22T09:00:00Z",
};

const criterion: SuccessCriterion = {
  id: "criterion-provenance",
  taskId: task.id,
  statement: "Trusted producer reports success",
  verificationInstruction: "Require provenance-gated system evidence.",
  kind: "objective",
  required: true,
};

const digest = `sha256:${"a".repeat(64)}`;

function producerEvidence(
  producerKind: EvidenceProducerKind,
  producerId = `enguru.${producerKind}`,
  content = "[DONECHECK:PASS] producer verification passed",
): Evidence {
  return createProducerEvidence({
    id: `evidence-${producerKind}`,
    taskId: task.id,
    criterionId: criterion.id,
    kind: "test_report",
    content,
    collectedAt: "2026-09-22T09:01:00Z",
    producerKind,
    producerId,
    executionId: `run-${producerKind}-1`,
    artifactDigest: digest,
    observedAt: "2026-09-22T09:01:00Z",
    verificationRef: `evidence://${producerKind}/run-1`,
  });
}

function run(evidence: Evidence[], trustedProducerIds: string[]) {
  return verifyTask({
    task,
    criteria: [criterion],
    aiOutput: "Work completed and submitted for verification.",
    evidence,
    resultId: "verification-provenance",
    verifiedAt: "2026-09-22T09:02:00Z",
    policy: {
      requireEvidenceProvenance: true,
      trustedProducerIds,
    },
  });
}

describe("DoneCheck evidence provenance and producer adapters", () => {
  it.each<EvidenceProducerKind>([
    "github_ci",
    "playwright",
    "langsmith",
    "braintrust",
    "mac_engineer",
  ])("normalizes %s as valid provenance-carrying system evidence", (producerKind) => {
    const evidence = producerEvidence(producerKind);
    expect(evidence.source).toBe("system");
    expect(evidence.provenance?.producerKind).toBe(producerKind);
    expect(validateEvidenceProvenance(evidence.provenance).valid).toBe(true);
  });

  it("passes when strict provenance policy trusts the producer identity", () => {
    const evidence = producerEvidence("github_ci", "enguru.github-ci");
    const result = run([evidence], ["enguru.github-ci"]);
    expect(result.outcome).toBe("pass");
    expect(result.criteria[0].reason).toContain("Trusted system evidence");
  });

  it("is inconclusive when a PASS assertion has no provenance under strict policy", () => {
    const evidence: Evidence = {
      id: "legacy-system-evidence",
      taskId: task.id,
      criterionId: criterion.id,
      kind: "test_report",
      source: "system",
      content: "[DONECHECK:PASS] legacy assertion",
      collectedAt: "2026-09-22T09:01:00Z",
    };
    const result = run([evidence], ["enguru.github-ci"]);
    expect(result.outcome).toBe("inconclusive");
    expect(result.criteria[0].reason).toContain("provenance policy");
  });

  it("is inconclusive when provenance producer identity is outside the trust allow-list", () => {
    const evidence = producerEvidence("github_ci", "untrusted.github-ci");
    const result = run([evidence], ["enguru.github-ci"]);
    expect(result.outcome).toBe("inconclusive");
  });

  it("honors a trusted FAIL assertion as fail", () => {
    const evidence = producerEvidence(
      "playwright",
      "enguru.playwright",
      "[DONECHECK:FAIL] browser acceptance failed",
    );
    const result = run([evidence], ["enguru.playwright"]);
    expect(result.outcome).toBe("fail");
  });

  it("fails closed at the producer adapter on malformed provenance digest", () => {
    expect(() =>
      createProducerEvidence({
        id: "bad-evidence",
        taskId: task.id,
        criterionId: criterion.id,
        kind: "test_report",
        content: "[DONECHECK:PASS] malformed provenance",
        collectedAt: "2026-09-22T09:01:00Z",
        producerKind: "github_ci",
        producerId: "enguru.github-ci",
        executionId: "run-bad",
        artifactDigest: "sha256:not-a-digest",
        observedAt: "2026-09-22T09:01:00Z",
      }),
    ).toThrow(EvidenceProducerError);
  });
});
