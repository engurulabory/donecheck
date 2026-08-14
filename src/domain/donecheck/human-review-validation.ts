import { z } from "zod";
import type { HumanReview } from "./human-review";
import { HUMAN_DECISIONS } from "./human-review";
const nonEmpty = (field: string) => z.string({ required_error: `${field} is required`, invalid_type_error: `${field} must be a string` }).trim().min(1, { message: `${field} must not be empty` });
const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}[Tt]\d{2}:\d{2}:\d{2}(\.\d+)?([Zz]|[+-]\d{2}:\d{2})$/;
const reviewedAtSchema = nonEmpty("reviewedAt").refine((value) => ISO_DATE_TIME.test(value) && !Number.isNaN(Date.parse(value)), { message: "reviewedAt must be a valid ISO-8601 date-time" });
export const humanReviewSchema = z.object({ id: nonEmpty("id"), taskId: nonEmpty("taskId"), verificationResultId: nonEmpty("verificationResultId"), decision: z.enum(HUMAN_DECISIONS as [string, ...string[]], { errorMap: () => ({ message: "decision is not supported" }) }), reason: nonEmpty("reason"), reviewerId: nonEmpty("reviewerId"), reviewedAt: reviewedAtSchema });
export type HumanReviewValidationIssue = { path: string; message: string };
export type HumanReviewValidationResult = { valid: true; review: HumanReview } | { valid: false; issues: HumanReviewValidationIssue[] };
export function validateHumanReview(input: unknown): HumanReviewValidationResult { const parsed = humanReviewSchema.safeParse(input); if (parsed.success) return { valid: true, review: parsed.data as HumanReview }; return { valid: false, issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })) }; }
export function isValidHumanReview(input: unknown): input is HumanReview { return humanReviewSchema.safeParse(input).success; }
