import { readFileSync } from "node:fs";
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

describe("EMUS P1 real CI artifact handoff", () => {
  const artifactPath = process.env.EMUS_P1_EVIDENCE_FILE;
  it.skipIf(!artifactPath)("verifies real TaskId from source-pinned Mac Engineer checkpoint", () => {
    const payload = JSON.parse(readFileSync(artifactPath!, "utf8")) as {
      schema: string; task_id: string; restarted_task_id: string;
      idempotent_task_id: string; test_result: string; verified_checkpoint: boolean;
      authority: string; checkpoint_payload: { step: number };
    };
    expect(payload.schema).toBe("enguru.emus.p1.task-identity-evidence/v1");
    expect(payload.task_id).toMatch(/^task_[a-f0-9]+$/);
    expect(payload.restarted_task_id).toBe(payload.task_id);
    expect(payload.idempotent_task_id).toBe(payload.task_id);
    expect(payload.test_result).toBe("PASS");
    expect(payload.verified_checkpoint).toBe(true);
    expect(payload.checkpoint_payload.step).toBe(1);
    expect(payload.authority).toBe("TEST_ONLY_NO_HUMAN_GRANT");
    const actualTask: Task = { ...task, id: payload.task_id };
    const actualCriterion: SuccessCriterion = { ...criterion, taskId: actualTask.id };
    const actualEvidence: Evidence = {
      ...evidence, taskId: actualTask.id, criterionId: actualCriterion.id,
      content: "[DONECHECK:PASS] source-pinned P1 two-store checkpoint and restart",
    };
    const actualRun = (items: Evidence[]) => verifyTask({
      task: actualTask, criteria: [actualCriterion], aiOutput: "P1 two-store run completed",
      evidence: items, resultId: "verification-emus-real-p1",
      verifiedAt: "2026-10-23T12:02:00Z",
    });
    const positive = actualRun([actualEvidence]);
    expect(positive.taskId).toBe(payload.task_id);
    expect(positive.outcome).toBe("pass");
    expect(positive.criteria[0].evidenceIds).toEqual([actualEvidence.id]);
    expect(actualRun([]).outcome).toBe("inconclusive");
    expect(actualRun([{ ...actualEvidence, taskId: "task_wrong" }]).outcome).toBe("fail");
  });
});
