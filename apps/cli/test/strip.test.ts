import { describe, expect, it } from "bun:test";
import strip from "../src/strip";

describe("object stripping", () => {
  it("strips default values of any kind", () => {
    const result = strip(
      {
        a: true,
        b: false,
        c: ["foo", "bar"],
        d: {
          e: true,
          f: false,
        },
        g: true,
      },
      {
        a: true,
        b: false,
        c: ["foo", "bar"],
        d: {
          e: true,
        },
        g: true,
      },
      {
        a: true,
        b: true,
      },
    );

    expect(result).toMatchObject({
      b: false,
      g: true,
      c: ["foo", "bar"],
      d: { e: true },
    });
  });
});
