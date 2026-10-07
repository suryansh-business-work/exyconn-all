/** The quote's plain-text summary, its file name and what the form submits. */
import { describe, expect, it } from "vitest";
import { DEFAULT_QUOTE_INPUT, estimate } from "../../../../src/lib/company/quote";
import {
  quoteSubmission,
  summaryFileName,
  summaryText,
} from "../../../../src/lib/company/quote-summary";

const quote = estimate(DEFAULT_QUOTE_INPUT);
const context = {
  generated: "4 October 2026",
  description: "",
  contactEmail: "services@example.com",
  siteUrl: "https://exyconn.com",
};
const contact = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  company: "Engines",
  notes: "",
};

describe("summaryText", () => {
  it("lists the project, team, timeline and costs line by line", () => {
    const lines = summaryText(quote, context).split("\n");
    expect(lines[0]).toBe("EXYCONN - PROJECT BUDGET ESTIMATE");
    expect(lines).toContain("Generated: 4 October 2026");
    expect(lines).toContain("Project type: MVP / Prototype");
    expect(lines).toContain("- Full Stack Engineer: 1 member(s) @ $50/hr");
    expect(lines).toContain("- QA Engineer: 1 member(s) @ $35/hr");
    expect(lines).toContain("Duration: 3 months");
    expect(lines).toContain("Work hours: 160h/month");
    expect(lines).toContain("Base cost: $40,800");
    expect(lines).toContain("Complexity: 0.6x (-40%)");
    expect(lines).toContain("ESTIMATED TOTAL: $24,480");
    expect(lines.at(-2)).toBe("Contact us: services@example.com");
    expect(lines.at(-1)).toBe("Website: https://exyconn.com");
  });

  it("includes the description only when one was written, trimmed", () => {
    expect(summaryText(quote, context)).not.toContain("Description:");
    expect(summaryText(quote, { ...context, description: "   " })).not.toContain("Description:");
    expect(summaryText(quote, { ...context, description: "  A CRM \n" })).toContain(
      "Description: A CRM\n"
    );
  });
});

describe("summaryFileName", () => {
  it("names the file after the date part of an ISO timestamp", () => {
    expect(summaryFileName("2026-10-04T18:30:00.000Z")).toBe(
      "exyconn-budget-estimate-2026-10-04.txt"
    );
  });
});

describe("quoteSubmission", () => {
  it("sends the contact fields, the total and the summary as the message", () => {
    expect(quoteSubmission(contact, quote, "SUMMARY")).toEqual({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      company: "Engines",
      subject: "project",
      page: "get-a-quote",
      estimate: "$24,480",
      message: "SUMMARY",
    });
  });

  it("puts trimmed notes before the summary and ignores blank ones", () => {
    expect(quoteSubmission({ ...contact, notes: " Call me " }, quote, "SUMMARY").message).toBe(
      "Call me\n\nSUMMARY"
    );
    expect(quoteSubmission({ ...contact, notes: "\n" }, quote, "SUMMARY").message).toBe("SUMMARY");
  });
});
