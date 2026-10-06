import { describe, expect, it } from "vitest";
import {
  ORDER_AGENTS_DEFAULTS,
  orderAgentsSchema as agentsSchema,
} from "../../src/components/company/order-agents/order-agents.schema";
import type { OrderAgentsText } from "../../src/components/company/order-agents";
import type { QuoteText } from "../../src/components/company/quote";
import type { Agent } from "../../src/lib/company/agents";
import { cmsDefaults } from "../cms-defaults";
import {
  QUOTE_FORM_DEFAULTS,
  STEP_FIELDS,
  quoteFormSchema,
} from "../../src/components/company/quote/quote.schema";

const agentsPage = cmsDefaults<{ agents: Agent[]; text: OrderAgentsText }>("agents.order");
const orderAgentsSchema = agentsSchema(
  agentsPage.agents.map((agent) => agent.id),
  agentsPage.text.messages
);
const quotePage = cmsDefaults<{ text: QuoteText; nextSteps: unknown[] }>("company.quote");
const QUOTE_STEPS = quotePage.text.steps;
const quoteNextSteps = quotePage.nextSteps;

/** The first message per field path, the way the form shows it. */
const errorsOf = (result: { error?: { issues: { path: PropertyKey[]; message: string }[] } }) => {
  const errors: Record<string, string> = {};
  for (const issue of result.error?.issues ?? []) {
    errors[issue.path.map(String).join(".")] ??= issue.message;
  }
  return errors;
};

const CONTACT = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  company: "",
  notes: "",
  captcha: "7",
};

describe("quote form schema", () => {
  const valid = { ...QUOTE_FORM_DEFAULTS, ...CONTACT };

  it("accepts the defaults once the contact step is filled", () => {
    expect(errorsOf(quoteFormSchema.safeParse(valid))).toEqual({});
  });

  it("names the contact fields when they are blank", () => {
    expect(errorsOf(quoteFormSchema.safeParse(QUOTE_FORM_DEFAULTS))).toEqual({
      firstName: "First name is required",
      lastName: "Last name is required",
      email: "Email is required",
      captcha: "Please solve the captcha",
    });
  });

  it("checks head counts, rates, months and the team size", () => {
    const errors = errorsOf(
      quoteFormSchema.safeParse({
        ...valid,
        team: [
          { roleId: "qa", count: 0.5, rate: 10, customLabel: "" },
          { roleId: "pm", count: 11, rate: 900, customLabel: "x".repeat(61) },
          { roleId: "pm", count: Number.NaN, rate: 50, customLabel: "" },
        ],
        customMonths: 0,
      })
    );
    expect(errors).toEqual({
      "team.0.count": "Whole people only",
      "team.0.rate": "At least $20/hr",
      "team.1.count": "At most 10",
      "team.1.rate": "At most $500/hr",
      "team.1.customLabel": "Too long!",
      "team.2.count": "Enter a number",
      customMonths: "At least 0.25 months",
    });
    expect(errorsOf(quoteFormSchema.safeParse({ ...valid, team: [] }))).toEqual({
      team: "Add at least one role",
    });
  });

  it("checks the right fields at each of the four steps", () => {
    expect(STEP_FIELDS).toHaveLength(QUOTE_STEPS.length);
    expect(quoteNextSteps).toHaveLength(3);
    expect(STEP_FIELDS.flat().toSorted((a, b) => a.localeCompare(b))).toEqual(
      Object.keys(QUOTE_FORM_DEFAULTS).toSorted((a, b) => a.localeCompare(b))
    );
  });
});

describe("order agents schema", () => {
  it("asks for at least one agent", () => {
    expect(errorsOf(orderAgentsSchema.safeParse({ ...ORDER_AGENTS_DEFAULTS, ...CONTACT }))).toEqual(
      { agentIds: "Please add at least one agent to your suite." }
    );
  });

  it("accepts known agents and refuses unknown ones", () => {
    const base = { ...ORDER_AGENTS_DEFAULTS, ...CONTACT };
    expect(errorsOf(orderAgentsSchema.safeParse({ ...base, agentIds: ["data-entry"] }))).toEqual(
      {}
    );
    expect(
      Object.keys(errorsOf(orderAgentsSchema.safeParse({ ...base, agentIds: ["robot-butler"] })))
    ).toEqual(["agentIds.0"]);
  });
});
