import { describe, it, expect } from "vitest";
import { CORE_VERSION } from "./index.js";

describe("Core Package Initialization", () => {
  it("exports correct core version", () => {
    expect(CORE_VERSION).toBe("1.0.0");
  });
});
