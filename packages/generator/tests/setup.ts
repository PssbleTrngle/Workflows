import { beforeAll, setSystemTime, spyOn } from "bun:test";

beforeAll(() => {
  setSystemTime(new Date("2025-01-01T00:00:00.000Z"));

  spyOn(Bun.hash, "wyhash").mockImplementation(() => BigInt(0xabcdef));
});
