import type { DateTime } from "..";

export type TestConclusion = "failure" | "success";
export type TestStatus =
  | "missing"
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

export type TestSetup = {
  ref: string;
  type: string;
  version: string;
};

export type TestResult = {
  conclusion?: TestConclusion;
  link: string;
  status: TestStatus;
  at: DateTime;
};

export type TestResults = {
  release?: TestResult;
  build?: TestResult;
};

export type TestedSetup = {
  setup: TestSetup;
  tests: TestResults;
};
