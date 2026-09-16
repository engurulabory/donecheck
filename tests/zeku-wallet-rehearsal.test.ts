import { describe, expect, it } from "vitest";
import {
  verifyTask,
  type Evidence,
  type SuccessCriterion,
  type Task,
} from "../src/donecheck-core";

const task: Task = {
  id: "zeku-wallet-gate1",
  title: "ZEKÜ Gate 1 wallet rehearsal",
  requestText:
    "Verify deterministic simulation deposit, withdrawal, restart persistence, and real-money isolation.",
  status: "awaiting_review",
  createdAt: "2026-09-16T07:30:00Z",
};

const criteria: SuccessCriterion[] = [
  {
    id: "wallet-deposit",
    taskId: task.id,
    statement: "Simulation deposit persists exactly.",
    verificationInstruction:
      "Verify €580 deposit yields €580 deposited, €0 withdrawn, €580 balance and survives reload.",
    kind: "objective",
    required: true,
  },
  {
    id: "wallet-withdraw",
    taskId: task.id,
    statement: "Simulation withdrawal reconciles exactly.",
    verificationInstruction:
      "Verify €55 withdrawal from €580 yields €525 balance.",
    kind: "objective",
    required: true,
  },
  {
    id: "wallet-restart",
    taskId: task.id,
    statement: "Simulation wallet survives restart/reload.",
    verificationInstruction:
      "Verify persisted totals remain €580 / €55 / €525 with exactly two events.",
    kind: "objective",
    required: true,
  },
  {
    id: "real-money-isolation",
    taskId: task.id,
    statement: "Rehearsal never moves real money.",
    verificationInstruction:
      "Verify every wallet event records real_money_moved=false.",
    kind: "objective",
    required: true,
  },
];

const evidence: Evidence[] = criteria.map((criterion) => ({
  id: `evidence-${criterion.id}`,
  taskId: task.id,
  criterionId: criterion.id,
  kind: "test_report",
  source: "system",
  content: `[DONECHECK:PASS] ZEKÜ wallet rehearsal criterion ${criterion.id} passed`,
  collectedAt: "2026-09-16T07:31:00Z",
}));

describe("ZEKÜ wallet rehearsal contract", () => {
  it("passes the pinned DoneCheck Working Core contract", () => {
    const result = verifyTask({
      task,
      criteria,
      aiOutput:
        "ZEKÜ produced criterion-scoped system evidence from an isolated wallet rehearsal.",
      evidence,
      resultId: "zeku-wallet-gate1-verification",
      verifiedAt: "2026-09-16T07:32:00Z",
    });

    expect(result.outcome).toBe("pass");
    expect(result.criteria).toHaveLength(4);
    expect(result.criteria.every((item) => item.outcome === "pass")).toBe(true);
  });

  it("fails closed if withdrawal evidence reports FAIL", () => {
    const tampered = evidence.map((item) =>
      item.criterionId === "wallet-withdraw"
        ? {
            ...item,
            content:
              "[DONECHECK:FAIL] withdrawal reconciliation mismatch",
          }
        : item,
    );

    const result = verifyTask({
      task,
      criteria,
      aiOutput:
        "ZEKÜ produced criterion-scoped system evidence from an isolated wallet rehearsal.",
      evidence: tampered,
      resultId: "zeku-wallet-gate1-verification-fail",
      verifiedAt: "2026-09-16T07:33:00Z",
    });

    expect(result.outcome).toBe("fail");
  });
});
