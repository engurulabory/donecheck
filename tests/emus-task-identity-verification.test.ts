import { describe, expect, it } from "vitest";
import { verifyTask, type Task, type SuccessCriterion, type Evidence } from "../src/donecheck-core";

// Contract-level boundary test: identity shape mirrors Mac Engineer task IDs.
// The real cross-repository task-ID transfer still requires integration evidence.
const taskId = "task_emus_p1_fixture";
const createdAt = "2026-10-23T12:00:00Z";
const task: Task = {
  id: taskId,
  title: "EMUS pinned two-store restart",
  requestText: "Preserve task identity and verified checkpoint after restart.",
  status: "awaiting_review",
  createdAt,
};
const criterion: SuccessCriterion = {
  id: "criterion-emus-identity",
  taskId,
  statement: "Verified restart retains the same task identity.",
  verificationInstruction: "Require criterion-scoped system test evidence.",
  kind: "objective",
  required: true,
};
const evidence: Evidence = {
  id: "evidence-emus-restart",
  taskId,
  criterionId: criterion.id,
  kind: "test_report",
  source: "system",
  content: "[DONECHECK:PASS] pinned two-store restart fixture",
  collectedAt: "2026-10-23T12:01:00Z",
};
const verify = (items: Evidence[]) => verifyTask({
  task,
  criteria: [criterion],
  aiOutput: "EMUS restart fixture verified.",
  evidence: items,
  resultId: "verification-emus-p1",
  verifiedAt: "2026-10-23T12:02:00Z",
});

describe("EMUS task identity to DoneCheck verifyTask contract boundary", () => {
  it("keeps input, result, criterion and evidence task identity on valid scoped evidence", () => {
    const result = verify([evidence]);
    expect(result.taskId).toBe(taskId);
    expect(result.outcome).toBe("pass");
    expect(result.criteria[0].evidenceIds).toEqual([evidence.id]);
  });
  it("rejects evidence belonging to a different task", () => {
    const result = verify([{ ...evidence, taskId: "task_other" }]);
    expect(result.outcome).toBe("fail");
  });
  it("stays inconclusive when no real criterion evidence is presented", () => {
    expect(verify([]).outcome).toBe("inconclusive");
  });
});
