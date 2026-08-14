import { z } from "zod";
import type { Task } from "./task";
import { TASK_STATUSES } from "./task";

const nonEmpty = (field: string) =>
  z.string({ required_error: `${field} is required`, invalid_type_error: `${field} must be a string` }).trim().min(1, { message: `${field} must not be empty` });

const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}[Tt]\d{2}:\d{2}:\d{2}(\.\d+)?([Zz]|[+-]\d{2}:\d{2})$/;
const isoDateTime = (field: string) => nonEmpty(field).refine((value) => ISO_DATE_TIME.test(value) && !Number.isNaN(Date.parse(value)), { message: `${field} must be a valid ISO-8601 date-time` });

export const taskSchema = z.object({
  id: nonEmpty("id"), title: nonEmpty("title"), requestText: nonEmpty("requestText"), description: z.string().optional(),
  status: z.enum(TASK_STATUSES as [string, ...string[]], { errorMap: () => ({ message: "status is not supported" }) }),
  createdAt: isoDateTime("createdAt"), updatedAt: isoDateTime("updatedAt").optional(),
});

export type TaskValidationIssue = { path: string; message: string };
export type TaskValidationResult = { valid: true; task: Task } | { valid: false; issues: TaskValidationIssue[] };
export function validateTask(input: unknown): TaskValidationResult { const parsed = taskSchema.safeParse(input); if (parsed.success) return { valid: true, task: parsed.data as Task }; return { valid: false, issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })) }; }
export function isValidTask(input: unknown): input is Task { return taskSchema.safeParse(input).success; }
