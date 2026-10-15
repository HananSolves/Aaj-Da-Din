import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadSettings, saveSettings } from "../src/settings/store.ts";
import type { Settings } from "../src/settings/types.ts";

const sync = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn() }));
vi.mock("wxt/browser", () => ({ browser: { storage: { sync } } }));

const MIRROR_KEY = "add:settings";
const stored: Settings = {
  schemaVersion: 3,
  calendars: ["hijri", "gregorian"],
  theme: "raat",
  dateStyle: "centered",
  background: "solid",
  hijriOffset: 1,
  festivalSets: ["muslim", "cultural"],
  gurpurabSource: "nanakshahi",
};
const mirrored: Settings = { ...stored, calendars: ["desi"], theme: "chitta" };

let local: Map<string, string>;

beforeEach(() => {
  local = new Map();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => local.get(key) ?? null,
    setItem: (key: string, value: string) => void local.set(key, value),
  });
  sync.get.mockReset().mockResolvedValue({});
  sync.set.mockReset().mockResolvedValue(undefined);
});

describe("loadSettings", () => {
  it("returns the synced settings and refreshes the mirror", async () => {
    sync.get.mockResolvedValue({ settings: stored });
    local.set(MIRROR_KEY, JSON.stringify(mirrored));
    expect(await loadSettings()).toEqual(stored);
    expect(JSON.parse(local.get(MIRROR_KEY) ?? "null")).toEqual(stored);
    expect(sync.get).toHaveBeenCalledWith("settings");
  });

  it.each([
    ["nothing stored", {}],
    ["garbage", { settings: "garbage" }],
    ["a newer schemaVersion", { settings: { ...stored, schemaVersion: 4 } }],
    ["an unknown calendar", { settings: { ...stored, calendars: ["julian"] } }],
  ])("returns null and leaves the mirror alone for %s", async (_name, result) => {
    sync.get.mockResolvedValue(result);
    local.set(MIRROR_KEY, JSON.stringify(mirrored));
    expect(await loadSettings()).toBeNull();
    expect(JSON.parse(local.get(MIRROR_KEY) ?? "null")).toEqual(mirrored);
  });

  it("never writes to storage.sync", async () => {
    sync.get.mockResolvedValue({ settings: stored });
    await loadSettings();
    expect(sync.set).not.toHaveBeenCalled();
  });

  it("falls back to the mirror when the read throws", async () => {
    sync.get.mockRejectedValue(new Error("sync unavailable"));
    local.set(MIRROR_KEY, JSON.stringify(mirrored));
    expect(await loadSettings()).toEqual(mirrored);
  });

  it("is null when the read throws and there is no mirror", async () => {
    sync.get.mockRejectedValue(new Error("sync unavailable"));
    expect(await loadSettings()).toBeNull();
  });

  it("still returns the settings when localStorage throws", async () => {
    sync.get.mockResolvedValue({ settings: stored });
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    });
    expect(await loadSettings()).toEqual(stored);
  });
});

describe("saveSettings", () => {
  it("writes storage.sync under one key, then the mirror", async () => {
    const order: string[] = [];
    sync.set.mockImplementation(async () => {
      order.push(`sync:${local.has(MIRROR_KEY) ? "mirror-present" : "no-mirror"}`);
    });
    await saveSettings(stored);
    order.push(local.has(MIRROR_KEY) ? "mirror-written" : "mirror-missing");
    expect(sync.set).toHaveBeenCalledWith({ settings: stored });
    expect(order).toEqual(["sync:no-mirror", "mirror-written"]);
    expect(JSON.parse(local.get(MIRROR_KEY) ?? "null")).toEqual(stored);
  });

  it("rejects and leaves the mirror unwritten when the sync write fails", async () => {
    sync.set.mockRejectedValue(new Error("quota"));
    await expect(saveSettings(stored)).rejects.toThrow("quota");
    expect(local.has(MIRROR_KEY)).toBe(false);
  });

  it("still saves when localStorage throws", async () => {
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      setItem: () => {
        throw new Error("blocked");
      },
    });
    await expect(saveSettings(stored)).resolves.toBeUndefined();
    expect(sync.set).toHaveBeenCalledOnce();
  });
});
