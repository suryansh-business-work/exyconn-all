import { type Estimate, formatAdjustment, formatDuration, formatUsd } from "./quote";

export interface SummaryContext {
  /** The date, already formatted for the reader. */
  generated: string;
  /** What the visitor wrote about the project, if anything. */
  description: string;
  /** Where to write about the estimate. */
  contactEmail: string;
  siteUrl: string;
}

const RULE = "=====================================";

/** The estimate as plain text — what "Download summary (.txt)" saves and what is sent. */
export const summaryText = (quote: Estimate, context: SummaryContext): string => {
  const lines = [
    "EXYCONN - PROJECT BUDGET ESTIMATE",
    RULE,
    `Generated: ${context.generated}`,
    "",
    "PROJECT DETAILS",
    `Project type: ${quote.projectType.label}`,
    ...(context.description.trim() ? [`Description: ${context.description.trim()}`] : []),
    "",
    "TEAM COMPOSITION",
    ...quote.team.map(
      (line) => `- ${line.label}: ${line.count} member(s) @ ${formatUsd(line.rate)}/hr`
    ),
    "",
    "PROJECT TIMELINE",
    `Duration: ${formatDuration(quote.months)}`,
    `Work hours: ${quote.hoursPerMonth}h/month`,
    "",
    "COST BREAKDOWN",
    `Base cost: ${formatUsd(quote.baseTotal)}`,
    `Complexity: ${quote.projectType.multiplier}x (${formatAdjustment(quote.projectType.multiplier)})`,
    "",
    `ESTIMATED TOTAL: ${formatUsd(quote.total)}`,
    RULE,
    "",
    "This is an estimate based on your selections. Final costs may vary based on specific requirements.",
    "",
    `Contact us: ${context.contactEmail}`,
    `Website: ${context.siteUrl}`,
  ];
  return lines.join("\n");
};

/** The saved file's name, e.g. exyconn-budget-estimate-2026-10-04.txt. */
export const summaryFileName = (isoDate: string): string =>
  `exyconn-budget-estimate-${isoDate.slice(0, 10)}.txt`;

export interface QuoteContact {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  notes: string;
}

/**
 * What /api/form-submit receives for a quote: the contact form's fields (so the portal files
 * it like any enquiry and the CRM makes a lead), with the summary as the message.
 */
export const quoteSubmission = (
  contact: QuoteContact,
  quote: Estimate,
  summary: string
): Record<string, string> => ({
  firstName: contact.firstName,
  lastName: contact.lastName,
  email: contact.email,
  company: contact.company,
  subject: "project",
  page: "get-a-quote",
  estimate: formatUsd(quote.total),
  message: contact.notes.trim() ? `${contact.notes.trim()}\n\n${summary}` : summary,
});
