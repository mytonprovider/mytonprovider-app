import { fmt, type FilterValues, type RangeId } from "@myton/ui/domain";
import { describe, expect, it } from "vitest";
import { providerWith, providers, silent, stable } from "./fixtures";
import { selectCatalog } from "./query";
import type { Provider } from "./types";

type Selection = Parameters<typeof selectCatalog>[1];

function select(list: Provider[], over: Partial<Selection> = {}): Provider[] {
  return selectCatalog(list, {
    only: null,
    search: "",
    filters: {},
    sort: { field: "rating", dir: "desc" },
    names: {},
    ...over,
  });
}

function pick(list: Provider[], filters: FilterValues, search = ""): Provider[] {
  return select(list, { filters, search });
}

function keeps(id: RangeId, from: number, to: number): boolean {
  return pick([stable], { [id]: { from, to } }).length === 1;
}

// The package's filter and this app's card are wired separately; a mismatch shows up only as a provider
// missing from its own range.
describe("filter scale", () => {
  it("matches the card on RAM", () => {
    expect(fmt.space(stable.telemetry?.totalRamBytes)).toBe("3.73 GB");
    expect(keeps("ram", 3.7, 3.8)).toBe(true);
    expect(keeps("ram", 4, 8)).toBe(false);
  });

  it("matches the card on disk, which arrives in GiB", () => {
    expect(fmt.space(stable.telemetry?.totalSpaceBytes)).toBe("3820 GB");
    expect(keeps("totalSpace", 3820, 3820)).toBe(true);
  });

  it("matches the card on network speed, which arrives in bits", () => {
    expect(fmt.mbits(stable.telemetry?.downloadBits)).toBe("1970 Mbit/s");
    expect(keeps("download", 1970, 1971)).toBe(true);
    expect(keeps("upload", 1177, 1178)).toBe(true);
  });

  it("matches the card on bag size and price", () => {
    expect(fmt.bytes(stable.maxBagBytes)).toBe("80 GB");
    expect(keeps("bagSize", 80, 80)).toBe(true);
    expect(fmt.price(stable.price)).toBe("10");
    expect(keeps("price", 10, 10.01)).toBe(true);
  });

  it("matches the card on disk speed, which fio reports on its own scale", () => {
    expect(keeps("diskRead", 63, 64)).toBe(true);
    expect(keeps("diskWrite", 18, 19)).toBe(true);
  });

  it("counts spans in days, and age from registration to right now", () => {
    expect(keeps("minSpan", 7, 7)).toBe(true);
    expect(keeps("maxSpan", 76, 77)).toBe(true);

    const tenDaysOld = providerWith({ reg_time: Math.floor(Date.now() / 1000) - 10 * 86400 });

    expect(pick([tenDaysOld], { age: { from: 9.9, to: 10.1 } }).length).toBe(1);
    expect(pick([tenDaysOld], { age: { from: 11, to: 20 } }).length).toBe(0);
  });
});

describe("selectCatalog", () => {
  it("searches the key and the name the owner gave", () => {
    expect(pick(providers, {}, stable.pubkey.slice(-6))).toEqual([stable]);
    expect(select(providers, { search: "moscow", names: { [silent.pubkey]: "Moscow node" } })).toEqual([silent]);
  });

  // The start pair hides a provider with no room left, and that is the one an owner searches for.
  it("lets a search reach past the filters, but not past the tab", () => {
    expect(pick(providers, { freeSpace: true }, silent.pubkey.slice(-6))).toEqual([silent]);
    expect(select(providers, { only: [stable.pubkey], search: silent.pubkey.slice(-6) })).toEqual([]);
  });

  it("restricts the tab to its own keys", () => {
    expect(select(providers, { only: [silent.pubkey] })).toEqual([silent]);
  });

  it("sorts by the field it is given", () => {
    expect(pick(providers, {}).map((p) => p.rating)).toEqual([20.415426, 16.33, 0]);
    const asc = select(providers, { sort: { field: "rating", dir: "asc" } });

    expect(asc.map((p) => p.rating)).toEqual([0, 16.33, 20.415426]);
  });
});
