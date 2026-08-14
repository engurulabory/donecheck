import { describe, expect, it } from "vitest";
import { HumanReviewTransitionError, transitionToHumanDecision, validateEvidence, validateTask, verifyTask, type Evidence, type HumanReview, type SuccessCriterion, type Task } from "../src/donecheck-core";

const task: Task = { id: "task-1", title: "Verified release", requestText: "Ship and prove the required test passes.", status: "awaiting_review", createdAt: "2026-08-14T12:00:00Z" };
const criterion: SuccessCriterion = { id: "criterion-1", taskId: task.id, statement: "Required test passes", verificationInstruction: "Use system test evidence.", kind: "objective", required: true };
const passEvidence: Evidence = { id: "evidence-1", taskId: task.id, criterionId: criterion.id, kind: "test_report", source: "system", content: "[DONECHECK:PASS] required test passed", collectedAt: "2026-08-14T12:05:00Z" };
const run = (evidence: Evidence[]) => verifyTask({ task, criteria: [criterion], aiOutput: "Implemented.", evidence, resultId: "verification-1", verifiedAt: "2026-08-14T12:06:00Z" });

describe("DoneCheck public release verification", () => {
  it("validates runtime boundaries", () => { expect(validateTask(task).valid).toBe(true); expect(validateTask({ ...task, createdAt: "bad" }).valid).toBe(false); expect(validateEvidence(passEvidence).valid).toBe(true); });
  it("passes with explicit criterion-scoped system PASS evidence", () => { const result = run([passEvidence]); expect(result.outcome).toBe("pass"); expect(result.criteria[0].evidenceIds).toEqual([passEvidence.id]); });
  it("is inconclusive when required evidence is missing", () => { expect(run([]).outcome).toBe("inconclusive"); });
  it("does not manufacture pass from human claims", () => { const humanClaim: Evidence = { ...passEvidence, source: "human", kind: "text", content: "[DONECHECK:PASS] I believe it passed" }; expect(run([humanClaim]).outcome).toBe("inconclusive"); });
  it("fails closed on duplicate evidence IDs", () => { const result = run([passEvidence, { ...passEvidence, content: "[DONECHECK:FAIL] duplicate" }]); expect(result.outcome).toBe("fail"); expect(result.reason).toContain("duplicate evidenceId"); });
  it("fails closed on cross-task evidence", () => { const result = run([{ ...passEvidence, taskId: "task-other" }]); expect(result.outcome).toBe("fail"); });
  it("preserves final human authority", () => { const result = run([passEvidence]); const review: HumanReview = { id: "review-1", taskId: task.id, verificationResultId: result.id, decision: "accepted", reason: "Evidence sufficient.", reviewerId: "reviewer-1", reviewedAt: "2026-08-14T12:07:00Z" }; const transition = transitionToHumanDecision(result, review); expect(transition.decision).toBe("accepted"); expect(transition.humanOverride).toBe(false); const revise = transitionToHumanDecision(result, { ...review, id: "review-2", decision: "revise", reason: "Human requests revision." }); expect(revise.decision).toBe("revise"); expect(revise.humanOverride).toBe(true); });
  it("fails closed on review/result reference mismatch", () => { const result = run([passEvidence]); const review: HumanReview = { id: "review-3", taskId: "task-other", verificationResultId: result.id, decision: "accepted", reason: "Wrong task.", reviewerId: "reviewer-1", reviewedAt: "2026-08-14T12:07:00Z" }; expect(() => transitionToHumanDecision(result, review)).toThrow(HumanReviewTransitionError); });
});
