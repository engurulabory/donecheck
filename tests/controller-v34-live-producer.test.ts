import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { createProducerEvidence, verifyTask, type Task, type SuccessCriterion } from "../src/donecheck-core";

const repo = "engurulabory/Engurulaboratuvari";
const runId = 39739829115;
const sourceSha = "5eb01e7ab7e67478b502a8f4fed3b161351e6118";
const workflowPath = ".github/workflows/enguru-five-minute-controller.yml";
const task: Task = {
  id: "controller-v34-real-run", title: "Verify authenticated external controller run",
  requestText: "Independently verify real GitHub Actions source and worker before machine PASS",
  status: "awaiting_review", createdAt: "2026-10-22T07:20:37Z"
};
const criterion: SuccessCriterion = {
  id: "controller-v34-live-criterion", taskId: task.id,
  statement: "Exact source and successful privileged worker were independently observed",
  verificationInstruction: "Require both real GitHub API responses and provenance-gated machine evidence",
  kind: "objective", required: true
};
type GhRun = { id: number; event: string; path: string; head_sha: string; status: string; conclusion: string; };
type GhJobs = { jobs: Array<{ name: string; status: string; conclusion: string }> };
async function getGitHub<T>(suffix: string): Promise<T> {
  const response = await fetch(`https://api.github.com/repos/${repo}/${suffix}`, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "enguru-donecheck-ci/1.2" },
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error(`GITHUB_REAL_EVIDENCE_HTTP_${response.status}`);
  return response.json() as Promise<T>;
}
function machine(producerTrusted: boolean, observation: boolean) {
  const digest = createHash("sha256").update(`${repo}:${runId}:${sourceSha}:${observation}`).digest("hex");
  const evidence = createProducerEvidence({
    id: "controller-v34-real-ci-evidence", taskId: task.id, criterionId: criterion.id,
    kind: "test_report", content: observation
      ? "[DONECHECK:PASS] exact-main run and privileged worker verified independently through GitHub API"
      : "[DONECHECK:FAIL] source or privileged worker authenticity mismatch",
    collectedAt: "2026-10-22T07:20:48Z", producerKind: "github_ci",
    producerId: "enguru.controller.github-api-verifier", executionId: String(runId),
    artifactDigest: `sha256:${digest}`, observedAt: "2026-10-22T07:20:48Z",
    verificationRef: `https://github.com/${repo}/actions/runs/${runId}`
  });
  return verifyTask({ task, criteria: [criterion], aiOutput: "Untrusted controller completion claim",
    evidence: [evidence], resultId: "controller-v34-live-machine-result",
    verifiedAt: "2026-10-22T07:21:00Z",
    policy: { requireEvidenceProvenance: true, trustedProducerIds: producerTrusted ? ["enguru.controller.github-api-verifier"] : [] } });
}
describe("ENGURU controller real GitHub read-only machine verification", () => {
  it("requires genuine exact-run, exact-source and successful worker API evidence", async () => {
    const [run, jobs] = await Promise.all([
      getGitHub<GhRun>(`actions/runs/${runId}`),
      getGitHub<GhJobs>(`actions/runs/${runId}/jobs?per_page=100`)
    ]);
    const worker = jobs.jobs.filter(x => x.name === "worker");
    const observed = run.id === runId && run.head_sha === sourceSha
      && run.path === workflowPath && run.event === "push"
      && run.status === "completed" && run.conclusion === "success"
      && worker.length === 1 && worker[0].status === "completed" && worker[0].conclusion === "success";
    expect(observed).toBe(true);
    expect(machine(true, observed).outcome).toBe("pass");
    expect(machine(false, observed).outcome).toBe("inconclusive");
    expect(machine(true, false).outcome).toBe("fail");
  });
});
