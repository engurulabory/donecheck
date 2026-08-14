import type { EvidenceId, IsoDateTime, SuccessCriterionId, TaskId, VerificationResultId } from "./ids";
export type VerificationOutcome = "pass" | "fail" | "inconclusive";
export const VERIFICATION_OUTCOMES: VerificationOutcome[] = ["pass", "fail", "inconclusive"];
export interface CriterionVerification { criterionId: SuccessCriterionId; outcome: VerificationOutcome; reason: string; evidenceIds: EvidenceId[]; }
export interface VerificationResult { id: VerificationResultId; taskId: TaskId; outcome: VerificationOutcome; reason: string; criteria: CriterionVerification[]; verifiedAt: IsoDateTime; }
