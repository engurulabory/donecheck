import { describe, expect, it } from "vitest";
import { toLanguageGovernanceView, type VerificationResult } from "../src/donecheck-core";

const makeResult = (outcome: VerificationResult["outcome"], evidenceIds: string[] = []): VerificationResult => ({
  id: "verification-1",
  taskId: "task-1",
  outcome,
  reason: outcome === "pass" ? "All required objective criteria passed." : outcome === "fail" ? "At least one required criterion failed." : "Required evidence is incomplete.",
  criteria: [{ criterionId: "criterion-1", outcome, reason: "criterion result", evidenceIds }],
  verifiedAt: "2026-08-19T00:00:00Z",
});

describe("ENGÜRÜ Language Governance™ projection", () => {
  it("projects PASS without turning it into final human acceptance", () => {
    const view = toLanguageGovernanceView(makeResult("pass", ["evidence-1"]));
    expect(view.state).toBe("pass");
    expect(view.evidenceIds).toEqual(["evidence-1"]);
    expect(view.nextAction).toContain("Human Review");
    expect(view.humanThresholdRequired).toBe(true);
  });

  it("routes inconclusive state to evidence collection, not completion language", () => {
    const view = toLanguageGovernanceView(makeResult("inconclusive"));
    expect(view.state).toBe("inconclusive");
    expect(view.evidenceIds).toEqual([]);
    expect(view.nextAction).toContain("Collect sufficient");
  });

  it("routes failed verification to revision and re-verification", () => {
    const view = toLanguageGovernanceView(makeResult("fail", ["evidence-2"]));
    expect(view.state).toBe("fail");
    expect(view.nextAction).toContain("run DoneCheck again");
  });

  it("deduplicates evidence references while preserving evidence binding", () => {
    const result = makeResult("pass", ["evidence-1", "evidence-1"]);
    const view = toLanguageGovernanceView(result);
    expect(view.evidenceIds).toEqual(["evidence-1"]);
  });
});
