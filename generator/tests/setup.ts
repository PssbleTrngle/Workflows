import { beforeAll, setSystemTime } from "bun:test";

beforeAll(() => {
  setSystemTime(new Date("2025-01-01T00:00:00.000Z"));
});
