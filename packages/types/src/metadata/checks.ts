export type Checks = {
  canModify: boolean;
  isProtected: boolean;
};

export type Check = keyof Checks;
