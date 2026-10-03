import { estimate } from "../../../lib/company/quote";
import { summaryFileName, summaryText } from "../../../lib/company/quote-summary";
import { SERVICES_EMAIL } from "../../../lib/company/contact";
import type { QuoteDraft } from "./quote-store";

/** The summary as text for this reader: today's date in the page's language. */
export const draftSummary = (draft: QuoteDraft): string =>
  summaryText(estimate(draft.input), {
    generated: new Intl.DateTimeFormat(document.documentElement.lang || undefined, {
      dateStyle: "long",
    }).format(new Date()),
    description: draft.description,
    contactEmail: SERVICES_EMAIL,
    siteUrl: globalThis.location.origin,
  });

/** Saves the summary as a .txt file — exactly what the button says it does. */
export const downloadSummary = (draft: QuoteDraft): void => {
  const blob = new Blob([draftSummary(draft)], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = summaryFileName(new Date().toISOString());
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
