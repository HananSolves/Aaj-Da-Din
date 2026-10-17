import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadSettings, NewerSettingsError, saveSettings } from "../src/settings/store.ts";
import type { Settings } from "../src/settings/types.ts";

const sync = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn() }));
vi.mock("wxt/browser", () => ({ browser: { storage: { sync } } }));

const MIRROR_KEY = "tarikh:settings";
const stored: Settings = {
  schemaVersion: 4,
  calendars: ["hijri", "gregorian"],
  theme: "raat",
  dateStyle: "centered",
  background: "solid",
  hijriOffset: 1,
  festivalSets: ["muslim", "cultural"],
  gurpurabSource: "nanakshahi",
  showFestivalLines: false,
  showFact: true,
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
    ["a newer schemaVersion", { settings: { ...stored, schemaVersion: 5 } }],
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

  it.each([
    ["nothing stored", {}],
    ["garbage", { settings: "garbage" }],
    ["an older schema", { settings: { ...stored, schemaVersion: 2 } }],
    ["the current schema", { settings: stored }],
  ])("writes over %s", async (_name, existing) => {
    sync.get.mockResolvedValue(existing);
    await saveSettings(stored);
    expect(sync.get).toHaveBeenCalledWith("settings");
    expect(sync.set).toHaveBeenCalledWith({ settings: stored });
  });

  it("refuses to overwrite a newer schema, leaving storage and the mirror alone", async () => {
    sync.get.mockResolvedValue({ settings: { ...stored, schemaVersion: 5 } });
    local.set(MIRROR_KEY, JSON.stringify(mirrored));
    await expect(saveSettings(stored)).rejects.toBeInstanceOf(NewerSettingsError);
    expect(sync.set).not.toHaveBeenCalled();
    expect(JSON.parse(local.get(MIRROR_KEY) ?? "null")).toEqual(mirrored);
  });

  it("rejects without writing when the pre-write read fails", async () => {
    sync.get.mockRejectedValue(new Error("sync unavailable"));
    await expect(saveSettings(stored)).rejects.toThrow("sync unavailable");
    expect(sync.set).not.toHaveBeenCalled();
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
