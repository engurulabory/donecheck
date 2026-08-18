import type { EvidenceId } from "./ids";
import type { VerificationResult } from "./verification-result";

/**
 * Read-only projection of a DoneCheck verification result into the locked
 * ENGÜRÜ Language Governance™ contract:
 * state → claim → evidence → next action
 *
 * This adapter does not create a second verification authority. DoneCheck
 * remains the verification authority and HumanReview remains final authority.
 */
export interface LanguageGovernanceView {
  state: VerificationResult["outcome"];
  claim: string;
  evidenceIds: EvidenceId[];
  nextAction: string;
  humanThresholdRequired: true;
}

const nextActionFor = (outcome: VerificationResult["outcome"]): string => {
  switch (outcome) {
    case "pass":
      return "Proceed to Human Review; automated PASS is not final acceptance.";
    case "fail":
      return "Revise failed criteria, produce new evidence, and run DoneCheck again.";
    case "inconclusive":
      return "Collect sufficient criterion-scoped evidence and run DoneCheck again.";
  }
};

export function toLanguageGovernanceView(result: VerificationResult): LanguageGovernanceView {
  const evidenceIds = [...new Set(result.criteria.flatMap((criterion) => criterion.evidenceIds))];

  return {
    state: result.outcome,
    claim: result.reason,
    evidenceIds,
    nextAction: nextActionFor(result.outcome),
    humanThresholdRequired: true,
  };
}
