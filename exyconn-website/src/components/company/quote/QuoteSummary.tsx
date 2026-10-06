import { estimate, formatUsd } from "../../../lib/company/quote";
import type { QuoteText } from "./quote.types";
import { downloadSummary } from "./download";
import { SummaryList } from "./SummaryList";
import { useQuoteDraft } from "./quote-store";
import "./quote.css";

/**
 * The summary panel beside the quote form (MultiStepFormShell's `summary` slot). Its own
 * island: it reads the draft the form writes, so the total follows every change.
 */
export function QuoteSummary({
  text,
  contactEmail,
}: Readonly<{ text: QuoteText["summary"]; contactEmail: string }>) {
  const draft = useQuoteDraft();
  const quote = estimate(draft.input);
  return (
    <div className="quote-summary">
      <h2 className="stage-label inner-index">{text.title}</h2>
      <p className="quote-total">{formatUsd(quote.total)}</p>
      <SummaryList quote={quote} text={text} />
      <p className="quote-note">{text.note}</p>
      <button
        type="button"
        className="inner-action inner-action--ghost w-full"
        onClick={() => downloadSummary(draft, contactEmail)}
      >
        {text.download}
      </button>
    </div>
  );
}
