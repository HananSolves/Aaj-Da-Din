import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadAskState, saveInstallDate, saveLastAskDate } from "../src/support/state.ts";

const local = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn() }));
vi.mock("wxt/browser", () => ({ browser: { storage: { local } } }));

beforeEach(() => {
  local.get.mockReset().mockResolvedValue({});
  local.set.mockReset().mockResolvedValue(undefined);
});

describe("loadAskState", () => {
  it("reads both keys from storage.local", async () => {
    local.get.mockResolvedValue({ installDate: "2026-09-01", lastAskDate: "2026-10-01" });
    expect(await loadAskState()).toEqual({ installDate: "2026-09-01", lastAskDate: "2026-10-01" });
    expect(local.get).toHaveBeenCalledWith(["installDate", "lastAskDate"]);
  });

  it("returns empty values when nothing is stored", async () => {
    expect(await loadAskState()).toEqual({ installDate: undefined, lastAskDate: undefined });
  });

  it("passes untrusted values through for the caller to validate", async () => {
    local.get.mockResolvedValue({ installDate: 5, lastAskDate: { a: 1 } });
    expect(await loadAskState()).toEqual({ installDate: 5, lastAskDate: { a: 1 } });
  });

  it("returns null when storage cannot be read, and never writes", async () => {
    local.get.mockRejectedValue(new Error("storage unavailable"));
    expect(await loadAskState()).toBeNull();
    expect(local.set).not.toHaveBeenCalled();
  });
});

describe("saving", () => {
  it("writes the install date under its own key", async () => {
    await saveInstallDate("2026-10-17");
    expect(local.set).toHaveBeenCalledWith({ installDate: "2026-10-17" });
  });

  it("writes the last ask date under its own key", async () => {
    await saveLastAskDate("2026-10-17");
    expect(local.set).toHaveBeenCalledWith({ lastAskDate: "2026-10-17" });
  });

  it("rejects when a write fails", async () => {
    local.set.mockRejectedValue(new Error("quota"));
    await expect(saveInstallDate("2026-10-17")).rejects.toThrow("quota");
    await expect(saveLastAskDate("2026-10-17")).rejects.toThrow("quota");
  });
});
