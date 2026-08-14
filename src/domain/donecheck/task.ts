import type { IsoDateTime, TaskId } from "./ids";

export type TaskStatus = "draft" | "in_progress" | "awaiting_review" | "closed";

export const TASK_STATUSES: readonly TaskStatus[] = [
  "draft",
  "in_progress",
  "awaiting_review",
  "closed",
];

/** A unit of work whose completion must be proven, not assumed. */
export interface Task {
  id: TaskId;
  title: string;
  requestText: string;
  description?: string;
  status: TaskStatus;
  createdAt: IsoDateTime;
  updatedAt?: IsoDateTime;
}
