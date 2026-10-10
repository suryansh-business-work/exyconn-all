import { describe, expect, it } from "vitest";

describe("env.d.ts", () => {
  it("stays a type-only module: loading it exports nothing at runtime", async () => {
    const declarations = await import("../../src/env.d");

    expect(Object.keys(declarations)).toEqual([]);
  });
});
