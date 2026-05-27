export default {
  gt: (a: number, b: number) => a > b,
  lt: (a: number, b: number) => a < b,
  gte: (a: number, b: number) => a >= b,
  lte: (a: number, b: number) => a <= b,
  eq: (a: unknown, b: unknown) => a === b,
  multiple: (value: number) => value > 1,
};
