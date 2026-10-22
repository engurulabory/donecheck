import { describe, expect, it } from "vitest";
import {
  createProducerEvidence,
  type SuccessCriterion,
  type Task,
  verifyTask,
} from "../src/donecheck-core";

// Controller v3.4 GitHub evidence reference. This is a replay rehearsal, not an
// independently authenticated live GitHub read or a final human acceptance.
const sourceCommit = "5eb01e7ab7e67478b502a8f4fed3b161351e6118";
const gitHubRun = "39739829115";
const task: Task = {
  id: "enguru-controller-v34-boundary",
  title: "ENGURU controller bounded end-to-end pilot",
  requestText: "Verify the existing owner-approved pilot task evidence.",
  status: "awaiting_review",
  createdAt: "2026-10-22T07:20:37Z",
};
const criterion: SuccessCriterion = {
  id: "controller-v34-ci-criterion",
  taskId: task.id,
  statement: "An authenticated exact-main controller run reports successful verification",
  verificationInstruction: "Accept only trusted, provenance-gated system evidence.",
  kind: "objective",
  required: true,
};
const base = {
  id: "controller-v34-github-evidence",
  taskId: task.id,
  criterionId: criterion.id,
  kind: "test_report" as const,
  collectedAt: "2026-10-22T07:20:48Z",
  producerKind: "github_ci" as const,
  producerId: "enguru.controller.github-actions",
  executionId: gitHubRun,
  artifactDigest: "sha256:9e65c8f9cfd9d9dd4f7759e0b15c704d9191f130a4aa56650cd108dc9e5996f8",
  observedAt: "2026-10-22T07:20:48Z",
  verificationRef: `https://github.com/engurulabory/Engurulaboratuvari/actions/runs/${gitHubRun}`,
};
function verify(content: string, trustedProducerIds: string[]) {
  return verifyTask({
    task,
    criteria: [criterion],
    aiOutput: "Controller supplied a bounded pilot execution receipt.",
    evidence: [createProducerEvidence({ ...base, content })],
    resultId: "controller-v34-rehearsal",
    verifiedAt: "2026-10-22T07:21:00Z",
    policy: { requireEvidenceProvenance: true, trustedProducerIds },
  });
}
describe("ENGURU controller v3.4 DoneCheck 1.2 machine rehearsal", () => {
  it("accepts properly scoped synthetic trusted PASS evidence at the machine layer", () => {
    const result = verify("[DONECHECK:PASS] authenticated external producer prerequisite (rehearsal)", ["enguru.controller.github-actions"]);
    expect(result.outcome).toBe("pass");
  });
  it("refuses to infer trust from a producer-declared PASS", () => {
    const result = verify("[DONECHECK:PASS] producer self-declared success", ["a.different-producer"]);
    expect(result.outcome).toBe("inconclusive");
  });
  it("honors a trusted negative machine observation", () => {
    const result = verify("[DONECHECK:FAIL] worker or source mismatch", ["enguru.controller.github-actions"]);
    expect(result.outcome).toBe("fail");
  });
  it("does not treat an ordinary AI claim as a machine PASS", () => {
    const result = verify("AI says work is done", ["enguru.controller.github-actions"]);
    expect(result.outcome).toBe("inconclusive");
  });
});
