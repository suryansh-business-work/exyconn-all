import { useFormContext } from "react-hook-form";
import { CaptchaField } from "../../forms/shared";
import { CAPTCHA_CLASS } from "../../forms/legal/legal-form.styles";
import { estimate, formatUsd, toQuoteInput } from "../../../lib/company/quote";
import { quoteText } from "../../../lib/company/quote-copy";
import { SummaryList } from "./SummaryList";
import type { QuoteFormValues } from "./quote.types";

interface ReviewStepProps {
  captcha: { question: string; error: string; onRefresh: () => void };
  /** Jumps back to a step to change it. */
  onEdit: (step: number) => void;
  steps: readonly string[];
}

/** Step 4: everything at a glance, a way back to each step, the security question. */
export function ReviewStep({ captcha, onEdit, steps }: Readonly<ReviewStepProps>) {
  const {
    register,
    getValues,
    formState: { errors },
  } = useFormContext<QuoteFormValues>();
  const values = getValues();
  const quote = estimate(toQuoteInput(values));
  return (
    <>
      <p className="inner-card__text">{quoteText.review.lede}</p>
      <div className="quote-review">
        <p className="quote-total">{formatUsd(quote.total)}</p>
        <SummaryList quote={quote} />
        <p className="inner-card__text text-sm">
          {values.firstName} {values.lastName} · {values.email}
          {values.company && ` · ${values.company}`}
        </p>
        <ul className="inner-chips">
          {steps.slice(0, -1).map((step, index) => (
            <li key={step}>
              <button type="button" className="inner-chip" onClick={() => onEdit(index)}>
                {`${quoteText.review.edit} ${step.toLowerCase()}`}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className={CAPTCHA_CLASS}>
        <CaptchaField
          question={captcha.question}
          registration={register("captcha")}
          error={errors.captcha?.message}
          captchaError={captcha.error}
          onRefresh={captcha.onRefresh}
          accent="amber"
        />
      </div>
    </>
  );
}
