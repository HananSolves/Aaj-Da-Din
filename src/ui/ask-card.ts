import { loadCalendarYear, localIso } from "../calendars/year-data.ts";
import { resolveFestivals } from "../festivals/rules.ts";
import type { Settings } from "../settings/types.ts";
import { en } from "../strings/en.ts";
import { type AskMessage, askTiming, decideAsk, isIsoDate } from "../support/ask.ts";
import { supportUrl } from "../support/links.ts";
import { loadAskState, saveInstallDate, saveLastAskDate } from "../support/state.ts";
import "./ask-card.css";

export interface AskCardOptions {
  now: Date;
  settings: Settings;
  parent: HTMLElement;
}

function card(message: AskMessage): HTMLElement {
  const link = document.createElement("a");
  link.href = supportUrl;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = message.action;

  const text = document.createElement("p");
  text.append(`${message.text} `, link);

  const dismiss = document.createElement("button");
  dismiss.type = "button";
  dismiss.textContent = "×";
  dismiss.setAttribute("aria-label", en.support.dismiss);

  const aside = document.createElement("aside");
  aside.className = "ask";
  aside.setAttribute("aria-label", en.support.cardLabel);
  aside.append(text, dismiss);
  dismiss.addEventListener("click", () => {
    aside.remove();
    // The button held focus; the gear is the next focusable element after the card.
    document.getElementById("settings-open")?.focus();
  });
  return aside;
}

/**
 * Shows the support card when plan §6 allows it. Every failure leaves the page as it was: the card
 * is optional and must never throw, log or block.
 */
export async function maybeShowAsk({ now, settings, parent }: AskCardOptions): Promise<void> {
  try {
    const state = await loadAskState();
    if (!state) return;

    const today = localIso(now);
    const timing = askTiming(today, state.installDate, state.lastAskDate);
    if (timing === "reset") {
      if (!isIsoDate(state.installDate)) await saveInstallDate(today);
      if (state.lastAskDate !== undefined && !isIsoDate(state.lastAskDate)) {
        await saveLastAskDate(today);
      }
      return;
    }
    if (timing === "wait") return;

    const query = {
      sets: settings.festivalSets,
      source: settings.gurpurabSource,
      hijriOffset: settings.hijriOffset,
    };
    const message = await decideAsk(now, async (date) => {
      const data = await loadCalendarYear(date.getFullYear()).catch(() => undefined);
      return data ? resolveFestivals(date, data, query) : [];
    });
    if (!message) return;

    // Written before the card appears, so a broken storage.local can never turn the ask into a nag.
    await saveLastAskDate(today);
    parent.append(card(message));
  } catch {
    // The page works without the card.
  }
}
