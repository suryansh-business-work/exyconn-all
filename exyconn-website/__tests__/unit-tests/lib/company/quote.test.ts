/** The get-a-quote estimator: options, arithmetic, labels and half-typed form values. */
import { describe, expect, it } from "vitest";
import {
  DEFAULT_QUOTE_INPUT,
  DURATION_PRESETS,
  HOURS_OPTIONS,
  PROJECT_TYPES,
  QUOTE_LIMITS,
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
} from "../../../../src/lib/company/quote";

const line = (roleId: string, overrides: Partial<TeamLine> = {}): TeamLine => ({
  roleId,
  count: 1,
  rate: findRole(roleId).rate,
  customLabel: "",
  ...overrides,
});

describe("options", () => {
  it("flattens the role groups and gives every option a unique id", () => {
    expect(ROLES).toEqual(ROLE_GROUPS.flatMap((group) => group.roles));
    for (const list of [PROJECT_TYPES, ROLES, DURATION_PRESETS, HOURS_OPTIONS]) {
      const ids = list.map((item) => item.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
    expect(ROLES.filter((role) => role.isCustom).map((role) => role.id)).toEqual(["custom"]);
    expect(QUOTE_LIMITS.minMonths).toBe(0.25);
  });
});

describe("findRole and durationMonths", () => {
  it("finds a role by id and refuses an unknown one", () => {
    expect(findRole("qa")).toEqual({ id: "qa", label: "QA Engineer", rate: 35 });
    expect(() => findRole("astronaut")).toThrow('Unknown option "astronaut"');
  });

  it("uses a preset's months, or the typed months for custom", () => {
    expect(durationMonths("1w", 99)).toBe(0.25);
    expect(durationMonths("12m", 99)).toBe(12);
    expect(durationMonths("custom", 7)).toBe(7);
    expect(() => durationMonths("forever", 1)).toThrow('Unknown option "forever"');
  });
});

describe("lineLabel", () => {
  it("names a custom role by its typed name, trimmed, else the role's label", () => {
    expect(lineLabel(line("custom", { customLabel: "  Growth lead " }))).toBe("Growth lead");
    expect(lineLabel(line("custom", { customLabel: "   " }))).toBe("Custom Role");
    expect(lineLabel(line("backend", { customLabel: "Ignored" }))).toBe("Backend Engineer");
  });
});

describe("estimate", () => {
  it("prices the default team with the project's multiplier", () => {
    expect(estimate(DEFAULT_QUOTE_INPUT)).toEqual({
      projectType: PROJECT_TYPES[0],
      team: [
        { label: "Full Stack Engineer", count: 1, rate: 50 },
        { label: "QA Engineer", count: 1, rate: 35 },
      ],
      teamSize: 2,
      months: 3,
      hoursPerMonth: 160,
      baseTotal: 40_800,
      total: 24_480,
    });
  });

  it("multiplies people, rate, hours and custom months and rounds the total", () => {
    const quote = estimate({
      projectTypeId: "ai",
      team: [line("ai-ml", { count: 2 }), line("custom", { rate: 33, customLabel: "Analyst" })],
      durationId: "custom",
      customMonths: 1.5,
      hoursId: "part",
    });
    expect(quote.baseTotal).toBe((2 * 60 + 33) * 80 * 1.5);
    expect(quote.total).toBe(Math.round(18_360 * 1.3));
    expect(quote.teamSize).toBe(3);
    expect(quote.team[1].label).toBe("Analyst");
  });

  it("costs nothing without a team and refuses unknown options", () => {
    expect(estimate({ ...DEFAULT_QUOTE_INPUT, team: [] })).toMatchObject({
      teamSize: 0,
      baseTotal: 0,
      total: 0,
    });
    expect(() => estimate({ ...DEFAULT_QUOTE_INPUT, projectTypeId: "x" })).toThrow();
    expect(() => estimate({ ...DEFAULT_QUOTE_INPUT, hoursId: "x" })).toThrow();
  });
});

describe("nextRole", () => {
  it("offers the first standard role not yet in the team", () => {
    expect(nextRole([]).id).toBe("pm");
    expect(nextRole([line("pm"), line("product")]).id).toBe("scrum");
  });

  it("offers the custom role once every standard role is used", () => {
    const everyone = ROLES.filter((role) => !role.isCustom).map((role) => line(role.id));
    expect(nextRole(everyone).id).toBe("custom");
  });
});

describe("formatting", () => {
  it("formats whole US dollars", () => {
    expect(formatUsd(24_480)).toBe("$24,480");
    expect(formatUsd(0)).toBe("$0");
    expect(formatUsd(99.6)).toBe("$100");
  });

  it("speaks in weeks under a month and months from one", () => {
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

describe("toQuoteInput", () => {
  it("fills missing choices with the defaults and prices an empty number as 0", () => {
    expect(toQuoteInput({})).toEqual({
      projectTypeId: "mvp",
      team: [],
      durationId: "3m",
      customMonths: 0,
      hoursId: "full",
    });
  });

  it("keeps the given choices", () => {
    expect(
      toQuoteInput({
        projectTypeId: "saas",
        durationId: "custom",
        customMonths: 4,
        hoursId: "part",
      })
    ).toMatchObject({
      projectTypeId: "saas",
      durationId: "custom",
      customMonths: 4,
      hoursId: "part",
    });
  });

  it("leaves out rows without a role and zeroes numbers mid-edit", () => {
    const input = toQuoteInput({
      team: [
        undefined,
        { count: 2 },
        { roleId: "qa", count: Number.NaN, rate: Number.POSITIVE_INFINITY },
        { roleId: "custom", count: 3, rate: 40, customLabel: "Analyst" },
      ],
    });
    expect(input.team).toEqual([
      { roleId: "qa", count: 0, rate: 0, customLabel: "" },
      { roleId: "custom", count: 3, rate: 40, customLabel: "Analyst" },
    ]);
  });
});
