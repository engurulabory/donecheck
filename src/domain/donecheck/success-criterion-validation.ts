import { z } from "zod";
import type { SuccessCriterion } from "./success-criterion";
import { CRITERION_KINDS } from "./success-criterion";
const nonEmpty = (field: string) => z.string({ required_error: `${field} is required`, invalid_type_error: `${field} must be a string` }).trim().min(1, { message: `${field} must not be empty` });
export const successCriterionSchema = z.object({
  id: nonEmpty("id"), taskId: nonEmpty("taskId"), statement: nonEmpty("statement"), verificationInstruction: nonEmpty("verificationInstruction"),
  kind: z.enum(CRITERION_KINDS as [string, ...string[]], { errorMap: () => ({ message: "kind is not supported" }) }),
  required: z.boolean({ invalid_type_error: "required must be a boolean" }),
});
export type SuccessCriterionValidationIssue = { path: string; message: string };
export type SuccessCriterionValidationResult = { valid: true; criterion: SuccessCriterion } | { valid: false; issues: SuccessCriterionValidationIssue[] };
export function validateSuccessCriterion(input: unknown): SuccessCriterionValidationResult { const parsed = successCriterionSchema.safeParse(input); if (parsed.success) return { valid: true, criterion: parsed.data as SuccessCriterion }; return { valid: false, issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })) }; }
export function isValidSuccessCriterion(input: unknown): input is SuccessCriterion { return successCriterionSchema.safeParse(input).success; }
