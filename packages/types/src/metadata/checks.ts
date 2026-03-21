export const enum Check {
  BRANCH_PROTECTED = "protected",
  APP_NOT_BLOCKED = "not_blocked",
}

export type Checks = Partial<Record<Check, boolean>>;
