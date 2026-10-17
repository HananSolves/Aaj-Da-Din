import { describe, expect, it } from "vitest";
import { en } from "../src/strings/en.ts";
import {
  askTiming,
  chooseMessage,
  decideAsk,
  isIsoDate,
  quietDays,
  shouldAskToday,
} from "../src/support/ask.ts";

const { messages } = en.support;

describe("isIsoDate", () => {
  it.each(["2026-10-17", "2028-02-29", "2026-12-31"])("accepts %s", (value) => {
    expect(isIsoDate(value)).toBe(true);
  });

  it.each([
    "2026-02-30",
    "2027-02-29",
    "2026-13-01",
    "2026-00-10",
    "2026-1-1",
    "2026-10-17T00:00",
    "",
    "garbage",
  ])("rejects %s", (value) => {
    expect(isIsoDate(value)).toBe(false);
  });

  it.each([undefined, null, 20261017, {}, []])("rejects the non-string %s", (value) => {
    expect(isIsoDate(value)).toBe(false);
  });
});

describe("askTiming", () => {
  it("waits until 14 days after install", () => {
    expect(askTiming("2026-10-17", "2026-10-05", undefined)).toBe("wait");
    expect(askTiming("2026-10-17", "2026-10-04", undefined)).toBe("wait");
    expect(askTiming("2026-10-17", "2026-10-03", undefined)).toBe("due");
    expect(askTiming("2026-10-17", "2026-09-01", undefined)).toBe("due");
  });

  it("waits until 30 days after the last ask", () => {
    expect(askTiming("2026-10-17", "2026-01-01", "2026-09-18")).toBe("wait");
    expect(askTiming("2026-10-17", "2026-01-01", "2026-09-17")).toBe("due");
    expect(askTiming("2026-10-17", "2026-01-01", "2026-10-17")).toBe("wait");
  });

  it("counts days across month, year and leap-day boundaries", () => {
    expect(askTiming("2027-01-02", "2026-12-19", undefined)).toBe("due");
    expect(askTiming("2027-01-01", "2026-12-19", undefined)).toBe("wait");
    expect(askTiming("2028-03-14", "2028-02-29", undefined)).toBe("due");
    expect(askTiming("2028-03-13", "2028-02-29", undefined)).toBe("wait");
    expect(askTiming("2028-03-30", "2028-01-01", "2028-02-29")).toBe("due");
    expect(askTiming("2028-03-29", "2028-01-01", "2028-02-29")).toBe("wait");
  });

  it.each([undefined, null, "", "garbage", "2026-02-30", 20261017, {}])(
    "resets for the install date %s",
    (installDate) => {
      expect(askTiming("2026-10-17", installDate, undefined)).toBe("reset");
      expect(askTiming("2026-10-17", installDate, "2026-01-01")).toBe("reset");
    },
  );

  it.each([null, "", "garbage", "2026-02-30", 20261017, {}])(
    "resets for a last-ask date that is present but invalid: %s",
    (lastAskDate) => {
      expect(askTiming("2026-10-17", "2026-01-01", lastAskDate)).toBe("reset");
    },
  );

  it("holds a date in the future instead of asking", () => {
    expect(askTiming("2026-10-17", "2026-12-01", undefined)).toBe("wait");
    expect(askTiming("2026-10-17", "2026-01-01", "2026-12-01")).toBe("wait");
  });

  it("throws for a bad today, which is a programmer error", () => {
    expect(() => askTiming("17/10/2026", "2026-01-01", undefined)).toThrow(RangeError);
  });
});

describe("shouldAskToday", () => {
  it("shows the ask on a celebration today, even with another one ahead", () => {
    expect(shouldAskToday(["diwali"], [])).toBe(true);
    expect(shouldAskToday(["diwali"], ["bandiChhorDivas"])).toBe(true);
  });

  it("waits when a celebration falls in the next days", () => {
    expect(shouldAskToday([], ["dussehra"])).toBe(false);
  });

  it("shows the ask when nothing is near", () => {
    expect(shouldAskToday([], [])).toBe(true);
  });

  it.each(quietDays)("never asks on the quiet day %s", (id) => {
    expect(shouldAskToday([id], [])).toBe(false);
    expect(shouldAskToday([id, "diwali"], [])).toBe(false);
  });

  it("does not wait for a quiet day that is only ahead", () => {
    expect(shouldAskToday([], ["ashura"])).toBe(true);
    expect(shouldAskToday([], ["shaheediGuruArjan", "shaheediGuruTegBahadur"])).toBe(true);
    expect(shouldAskToday([], ["ashura", "holi"])).toBe(false);
  });
});

describe("chooseMessage", () => {
  const day = (month: number, date: number) => new Date(2026, month - 1, date);

  it("greets Vaisakhi and both Eids", () => {
    expect(chooseMessage(["vaisakhi"], day(4, 14))).toBe(messages.vaisakhi);
    expect(chooseMessage(["eidAlFitr"], day(3, 20))).toBe(messages.eid);
    expect(chooseMessage(["eidAlAdha"], day(5, 27))).toBe(messages.eid);
  });

  it("prefers Vaisakhi when two greeted festivals share a day", () => {
    expect(chooseMessage(["eidAlFitr", "vaisakhi"], day(4, 14))).toBe(messages.vaisakhi);
  });

  it("uses a general message for any other festival, never a festival-name greeting", () => {
    const other = chooseMessage(["diwali", "bandiChhorDivas"], day(11, 8));
    expect(messages.general).toContain(other);
    expect(JSON.stringify(other)).not.toMatch(/mubarak/i);
  });

  it("rotates the general messages day by day from 1 January 2026", () => {
    expect(chooseMessage([], day(1, 1))).toBe(messages.general[0]);
    expect(chooseMessage([], day(1, 2))).toBe(messages.general[1]);
    expect(chooseMessage([], day(1, 3))).toBe(messages.general[0]);
    expect(chooseMessage([], new Date(2025, 11, 31))).toBe(messages.general[1]);
  });

  it("ends every message with an action that carries the arrow", () => {
    for (const m of [messages.vaisakhi, messages.eid, ...messages.general]) {
      expect(m.action.endsWith("→")).toBe(true);
    }
  });
});

describe("decideAsk", () => {
  const key = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const calendar = (festivals: Record<string, string[]>) => async (date: Date) =>
    festivals[key(date)] ?? [];

  it("asks with the festival greeting on the day", async () => {
    const message = await decideAsk(
      new Date(2026, 3, 14),
      calendar({ "2026-04-14": ["vaisakhi"] }),
    );
    expect(message).toBe(messages.vaisakhi);
  });

  it("waits when a celebration is 1 to 3 days ahead", async () => {
    for (const ahead of ["2026-10-18", "2026-10-19", "2026-10-20"]) {
      expect(
        await decideAsk(new Date(2026, 9, 17), calendar({ [ahead]: ["dussehra"] })),
      ).toBeNull();
    }
  });

  it("does not wait for a celebration 4 days ahead", async () => {
    const message = await decideAsk(new Date(2026, 9, 17), calendar({ "2026-10-21": ["holi"] }));
    expect(messages.general).toContain(message);
  });

  it("is silent on a quiet day", async () => {
    expect(
      await decideAsk(new Date(2026, 9, 17), calendar({ "2026-10-17": ["ashura"] })),
    ).toBeNull();
  });

  it("looks across the year boundary in late December", async () => {
    const festivals = { "2027-01-01": ["holi"] };
    expect(await decideAsk(new Date(2026, 11, 29), calendar(festivals))).toBeNull();
    expect(messages.general).toContain(
      await decideAsk(new Date(2026, 11, 28), calendar(festivals)),
    );
  });

  it("asks idsFor for today and the next 3 days only", async () => {
    const seen: string[] = [];
    await decideAsk(new Date(2026, 9, 17), async (date) => {
      seen.push(key(date));
      return [];
    });
    expect(seen).toEqual(["2026-10-17", "2026-10-18", "2026-10-19", "2026-10-20"]);
  });
});
