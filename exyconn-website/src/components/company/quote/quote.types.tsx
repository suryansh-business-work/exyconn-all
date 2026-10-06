import type { z } from "zod";
import type { CaptchaCopy, SubmitCopy } from "../../forms/shared";
import type { quoteFormSchema } from "./quote.schema";

/** What the quote form holds; the captcha answer is checked by the portal and never stored. */
export type QuoteFormValues = z.infer<typeof quoteFormSchema>;

/** A radio card: an option's id, its name and an optional second line. */
export interface ChoiceOption {
  id: string;
  label: string;
  detail?: string;
}

/**
 * Every word of the quote form and its summary panel (CMS props of 'company.quote'). The
 * options, rates and arithmetic stay in src/lib/company/quote.ts.
 */
export interface QuoteText {
  /** The four step names, in order. */
  steps: readonly string[];
  /** Names {current} and {total}. */
  progress: string;
  formLabel: string;
  back: string;
  next: string;
  send: string;
  sending: string;
  service: { legend: string; describe: string; describePlaceholder: string };
  scope: {
    team: string;
    role: string;
    count: string;
    rate: string;
    customName: string;
    customNamePlaceholder: string;
    addRole: string;
    /** Names {role}. */
    removeRole: string;
    duration: string;
    customMonths: string;
    hours: string;
    hoursUnit: string;
  };
  contact: {
    firstName: string;
    lastName: string;
    email: string;
    company: string;
    notes: string;
    optional: string;
  };
  review: { lede: string; edit: string };
  summary: {
    title: string;
    projectType: string;
    team: string;
    duration: string;
    hours: string;
    hoursSuffix: string;
    base: string;
    complexity: string;
    members: string;
    note: string;
    download: string;
  };
  sent: string;
  /** Where the downloaded summary says to write. */
  contactEmail: string;
  captcha: CaptchaCopy;
  status: SubmitCopy;
}
