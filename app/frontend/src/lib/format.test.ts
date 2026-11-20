import { describe, expect, it } from "vitest";
import { levelTone, uptimeTone } from "./format";

describe("tones", () => {
  it("warns a level before it reaches the threshold", () => {
    expect(levelTone(80, 80)).toBe("red");
    expect(levelTone(68, 80)).toBe("orange");
    expect(levelTone(67, 80)).toBe("green");
  });

  it("greys out uptime nobody measured", () => {
    expect(uptimeTone(99)).toBe("green");
    expect(uptimeTone(95)).toBe("yellow");
    expect(uptimeTone(94)).toBe("red");
    expect(uptimeTone(0)).toBe("gray");
  });
});
