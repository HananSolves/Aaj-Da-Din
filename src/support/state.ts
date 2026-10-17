import { browser } from "wxt/browser";

export interface AskState {
  installDate?: unknown;
  lastAskDate?: unknown;
}

/**
 * Reads the two ask dates. `null` means storage could not be read, so the caller must do nothing:
 * writing an install date after a failed read would re-baseline someone who already has one.
 */
export async function loadAskState(): Promise<AskState | null> {
  try {
    const { installDate, lastAskDate } = await browser.storage.local.get([
      "installDate",
      "lastAskDate",
    ]);
    return { installDate, lastAskDate };
  } catch {
    return null;
  }
}

export function saveInstallDate(date: string): Promise<void> {
  return browser.storage.local.set({ installDate: date });
}

export function saveLastAskDate(date: string): Promise<void> {
  return browser.storage.local.set({ lastAskDate: date });
}
