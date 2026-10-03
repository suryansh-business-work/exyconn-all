import { type SubmitEvent, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitButton, SubmitStatusAlert, useCaptchaSubmit } from "../../forms/shared";
import { estimate, toQuoteInput } from "../../../lib/company/quote";
import { QUOTE_STEPS, quoteText } from "../../../lib/company/quote-copy";
import { quoteSubmission } from "../../../lib/company/quote-summary";
import { announceFormStep } from "../../../scripts/inner/form-step";
import { highlightStage } from "../../../scripts/stage3d/events";
import { ContactStep } from "./ContactStep";
import { QuoteSent } from "./QuoteSent";
import { ReviewStep } from "./ReviewStep";
import { ScopeStep } from "./ScopeStep";
import { ServiceStep } from "./ServiceStep";
import { draftSummary } from "./download";
import { QUOTE_FORM_DEFAULTS, STEP_FIELDS, quoteFormSchema } from "./quote.schema";
import { setQuoteDraft } from "./quote-store";
import type { QuoteFormValues } from "./quote.types";
import { SUBMIT_CLASS } from "../../forms/legal/legal-form.styles";
import "./quote.css";

const LAST = QUOTE_STEPS.length - 1;
/** The beacon's outermost ring: lit when the estimate is sent. */
const SENT_RING = QUOTE_STEPS.length;

const draftOf = (values: Partial<QuoteFormValues>) => ({
  input: toQuoteInput(values),
  description: values.description ?? "",
});

/**
 * The get-a-quote form (React Hook Form + Zod): service → scope → contact → review. Each
 * step is checked before the next; the estimate goes to /api/form-submit as a contact
 * enquiry, captcha and all. The summary panel follows along through the shared draft.
 */
export function QuoteForm() {
  const methods = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: QUOTE_FORM_DEFAULTS,
    mode: "onTouched",
  });
  const [step, setStep] = useState(0);
  const [sent, setSent] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);
  const { captcha, captchaError, refreshCaptcha, status, submit } = useCaptchaSubmit(
    "contact",
    () => {
      setSent(true);
      highlightStage(SENT_RING);
    }
  );

  useEffect(() => {
    const subscription = methods.watch((values) =>
      setQuoteDraft(draftOf(values as Partial<QuoteFormValues>))
    );
    return () => subscription.unsubscribe();
  }, [methods]);

  useEffect(() => {
    if (moved.current) {
      headingRef.current?.focus();
    }
  }, [step, sent]);

  const show = (next: number) => {
    moved.current = true;
    setStep(next);
    announceFormStep(next);
  };

  const goNext = async () => {
    if (await methods.trigger([...STEP_FIELDS[step]])) {
      highlightStage(step + 1);
      show(step + 1);
    }
  };

  const send = (values: QuoteFormValues) => {
    const draft = draftOf(values);
    const payload = quoteSubmission(values, estimate(draft.input), draftSummary(draft));
    return submit(values.captcha, payload);
  };

  const onSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const action = step < LAST ? goNext() : methods.handleSubmit(send)();
    action.catch((error: unknown) => console.error("The quote form failed", error));
  };

  if (sent) {
    return <QuoteSent headingRef={headingRef} message={quoteText.sent} />;
  }

  return (
    <FormProvider {...methods}>
      <div className="legal-form quote-form">
        <SubmitStatusAlert status={status} successMessage={quoteText.sent} />
        <form aria-label={quoteText.formLabel} onSubmit={onSubmit} noValidate>
          <h2 ref={headingRef} tabIndex={-1} className="inner-h3 quote-step-title">
            {QUOTE_STEPS[step]}
          </h2>
          {step === 0 && <ServiceStep />}
          {step === 1 && <ScopeStep />}
          {step === 2 && <ContactStep />}
          {step === LAST && (
            <ReviewStep
              steps={QUOTE_STEPS}
              onEdit={show}
              captcha={{
                question: captcha.question,
                error: captchaError,
                onRefresh: refreshCaptcha,
              }}
            />
          )}
          <div className="quote-nav">
            {step > 0 && (
              <button
                type="button"
                className="inner-action inner-action--ghost"
                onClick={() => show(step - 1)}
              >
                {quoteText.back}
              </button>
            )}
            {step < LAST ? (
              <button type="submit" className="inner-action inner-action--primary">
                {quoteText.next}
              </button>
            ) : (
              <SubmitButton
                isSubmitting={methods.formState.isSubmitting}
                className={SUBMIT_CLASS}
                label={quoteText.send}
                busyLabel={quoteText.sending}
              />
            )}
          </div>
        </form>
      </div>
    </FormProvider>
  );
}
