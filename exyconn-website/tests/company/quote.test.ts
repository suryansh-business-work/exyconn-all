import { describe, expect, it } from "vitest";
import {
  DEFAULT_QUOTE_INPUT,
  DURATION_PRESETS,
  HOURS_OPTIONS,
  PROJECT_TYPES,
  ROLE_GROUPS,
  ROLES,
  durationMonths,
  estimate,
  findRole,
  formatAdjustment,
  formatDuration,
  formatUsd,
  lineLabel,
  nextRole,
  toQuoteInput,
  type TeamLine,
} from "../../src/lib/company/quote";
import { quoteSubmission, summaryFileName, summaryText } from "../../src/lib/company/quote-summary";

const line = (roleId: string, count = 1, customLabel = ""): TeamLine => ({
  roleId,
  count,
  rate: findRole(roleId).rate,
  customLabel,
});

describe("quote options", () => {
  it("keeps the rates and roles the calculator has always used", () => {
    expect(ROLES.map((role) => [role.id, role.rate])).toEqual([
      ["pm", 50],
      ["product", 55],
      ["scrum", 48],
      ["frontend", 40],
      ["backend", 45],
      ["fullstack", 50],
      ["ai-ml", 60],
      ["devops", 55],
      ["data", 55],
      ["security", 65],
      ["designer", 38],
      ["qa", 35],
      ["qa-auto", 45],
      ["custom", 50],
    ]);
    expect(ROLE_GROUPS.map((group) => group.name)).toEqual([
      "Product & Management",
      "Engineering",
      "Design & QA",
      "Custom",
    ]);
    expect(PROJECT_TYPES.map((type) => type.multiplier)).toEqual([0.6, 1, 1.5, 0.8, 1.3, 1.1, 1]);
    expect(DURATION_PRESETS.map((preset) => preset.months)).toEqual([0.25, 1, 3, 6, 12, 0]);
    expect(HOURS_OPTIONS.map((option) => option.hours)).toEqual([80, 160, 200]);
  });

  it("refuses an option it does not know", () => {
    expect(() => findRole("astronaut")).toThrow('Unknown option "astronaut"');
  });
});

describe("estimate", () => {
  it("prices the default team the way the old calculator did", () => {
    // (1 × 50 + 1 × 35) $/h × 160 h × 3 months = 40,800; MVP × 0.6 = 24,480.
    const quote = estimate(DEFAULT_QUOTE_INPUT);
    expect(quote.baseTotal).toBe(40800);
    expect(quote.total).toBe(24480);
    expect(quote.teamSize).toBe(2);
    expect(quote.months).toBe(3);
    expect(quote.hoursPerMonth).toBe(160);
    expect(quote.team).toEqual([
      { label: "Full Stack Engineer", count: 1, rate: 50 },
      { label: "QA Engineer", count: 1, rate: 35 },
    ]);
  });

  it("uses the typed months for a custom duration and rounds the total", () => {
    const quote = estimate({
      projectTypeId: "ai",
      team: [line("ai-ml", 2)],
      durationId: "custom",
      customMonths: 1.5,
      hoursId: "part",
    });
    expect(quote.baseTotal).toBe(14400);
    expect(quote.total).toBe(18720);
  });

  it("names a custom role by what was typed, else by the role", () => {
    expect(lineLabel(line("custom", 1, "  Prompt engineer "))).toBe("Prompt engineer");
    expect(lineLabel(line("custom", 1, "   "))).toBe("Custom Role");
    expect(lineLabel(line("pm", 1, "ignored"))).toBe("Project Manager");
  });

  it("reads a preset's months, or the typed ones for custom", () => {
    expect(durationMonths("1w", 9)).toBe(0.25);
    expect(durationMonths("custom", 9)).toBe(9);
  });

  it("adds the first unused standard role, then the custom one", () => {
    expect(nextRole([line("pm")]).id).toBe("product");
    const everyStandard = ROLES.filter((role) => !role.isCustom).map((role) => line(role.id));
    expect(nextRole(everyStandard).id).toBe("custom");
  });
});

describe("toQuoteInput", () => {
  it("prices a half-typed form instead of returning NaN", () => {
    const input = toQuoteInput({
      team: [
        { roleId: "qa", count: Number.NaN, rate: 35 },
        undefined,
        { count: 2 },
        { roleId: "pm", count: 2, rate: 50, customLabel: "x" },
      ],
      customMonths: Number.NaN,
    });
    expect(input).toEqual({
      projectTypeId: "mvp",
      team: [
        { roleId: "qa", count: 0, rate: 35, customLabel: "" },
        { roleId: "pm", count: 2, rate: 50, customLabel: "x" },
      ],
      durationId: "3m",
      customMonths: 0,
      hoursId: "full",
    });
  });

  it("keeps what was chosen and copes with no team at all", () => {
    expect(
      toQuoteInput({ projectTypeId: "saas", durationId: "6m", hoursId: "part", customMonths: 4 })
    ).toEqual({
      projectTypeId: "saas",
      team: [],
      durationId: "6m",
      customMonths: 4,
      hoursId: "part",
    });
  });
});

describe("formatting", () => {
  it("writes dollars without cents", () => {
    expect(formatUsd(24480)).toBe("$24,480");
    expect(formatUsd(10.6)).toBe("$11");
  });

  it("writes weeks under a month and months otherwise, singular when one", () => {
    expect(formatDuration(0.25)).toBe("1 week");
    expect(formatDuration(0.5)).toBe("2 weeks");
    expect(formatDuration(1)).toBe("1 month");
    expect(formatDuration(3)).toBe("3 months");
  });

  it("signs the complexity adjustment", () => {
    expect(formatAdjustment(1.3)).toBe("+30%");
    expect(formatAdjustment(0.6)).toBe("-40%");
    expect(formatAdjustment(1)).toBe("0%");
  });
});

describe("quote summary", () => {
  const quote = estimate(DEFAULT_QUOTE_INPUT);
  const context = {
    generated: "4 October 2026",
    description: "",
    contactEmail: "services@exyconn.com",
    siteUrl: "https://exyconn.com",
  };

  it("lists the selections, the breakdown and the total", () => {
    const text = summaryText(quote, context);
    expect(text).toContain("Generated: 4 October 2026");
    expect(text).toContain("Project type: MVP / Prototype");
    expect(text).not.toContain("Description:");
    expect(text).toContain("- Full Stack Engineer: 1 member(s) @ $50/hr");
    expect(text).toContain("Duration: 3 months");
    expect(text).toContain("Work hours: 160h/month");
    expect(text).toContain("Base cost: $40,800");
    expect(text).toContain("Complexity: 0.6x (-40%)");
    expect(text).toContain("ESTIMATED TOTAL: $24,480");
    expect(text).toContain("Contact us: services@exyconn.com");
  });

  it("includes the description when one was written", () => {
    expect(summaryText(quote, { ...context, description: "  A kiosk app " })).toContain(
      "Description: A kiosk app"
    );
  });

  it("names the file after the day", () => {
    expect(summaryFileName("2026-10-04T10:00:00.000Z")).toBe(
      "exyconn-budget-estimate-2026-10-04.txt"
    );
  });

  it("sends the contact fields with the summary as the message", () => {
    const contact = {
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      company: "",
      notes: "",
    };
    expect(quoteSubmission(contact, quote, "SUMMARY")).toEqual({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      company: "",
      subject: "project",
      page: "get-a-quote",
      estimate: "$24,480",
      message: "SUMMARY",
    });
    expect(quoteSubmission({ ...contact, notes: " Soon " }, quote, "SUMMARY").message).toBe(
      "Soon\n\nSUMMARY"
    );
  });
});
