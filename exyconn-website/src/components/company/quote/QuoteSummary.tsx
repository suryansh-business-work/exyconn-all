import { estimate, formatUsd } from "../../../lib/company/quote";
import { quoteText } from "../../../lib/company/quote-copy";
import { downloadSummary } from "./download";
import { SummaryList } from "./SummaryList";
import { useQuoteDraft } from "./quote-store";
import "./quote.css";

const text = quoteText.summary;

/**
 * The summary panel beside the quote form (MultiStepFormShell's `summary` slot). Its own
 * island: it reads the draft the form writes, so the total follows every change.
 */
export function QuoteSummary() {
  const draft = useQuoteDraft();
  const quote = estimate(draft.input);
  return (
    <div className="quote-summary">
      <h2 className="stage-label inner-index">{text.title}</h2>
      <p className="quote-total">{formatUsd(quote.total)}</p>
      <SummaryList quote={quote} />
      <p className="quote-note">{text.note}</p>
      <button
        type="button"
        className="inner-action inner-action--ghost w-full"
        onClick={() => downloadSummary(draft)}
      >
        {text.download}
      </button>
    </div>
  );
}
