import type { DateTime } from "..";

export type TestConclusion = "failure" | "success";
export type TestStatus =
  | "in_progress"
  | "waiting"
  | "pending"
  | "requested"
  | "completed"
  | "action_required"
  | "cancelled"
  | "failure"
  | "neutral"
  | "skipped"
  | "stale"
  | "success"
  | "timed_out"
  | "queued";

export type TestResult = {
  conclusion?: TestConclusion;
  status: TestStatus;
  at: DateTime;
};
