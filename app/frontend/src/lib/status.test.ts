import type { BagState } from "@/data/backend";
import type { StatusTone } from "@myton/ui/domain";
import { describe, expect, it } from "vitest";
import { filterTone, stateTone } from "./status";

// Typed by BagState: a state added on the backend stops the build here.
const STATE_TONES: Record<BagState, StatusTone> = {
  confirmed: "green",
  downloading: "yellow",
  not_accepted: "gray",
  unavailable: "orange",
  not_confirmed: "red",
  not_paid: "orange",
  closed: "gray",
  partial: "yellow",
  not_hired: "gray",
};

describe("bag states", () => {
  it("gives every state its tone", () => {
    for (const [state, tone] of Object.entries(STATE_TONES) as [BagState, StatusTone][]) {
      expect(stateTone(state)).toBe(tone);
    }
  });

  it("tones the slices that are not states apart", () => {
    expect(filterTone("all")).toBe("accent");
    expect(filterTone("check")).toBe("gray");
    expect(filterTone("confirmed")).toBe("green");
  });
});
