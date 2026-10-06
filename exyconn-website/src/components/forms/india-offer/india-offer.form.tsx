import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormField, SubmitButton, inputClassName, useCaptchaSubmit } from "../shared";
import { planOptionLabel, type OfferPlan } from "../../../lib/india/plans";
import { INDIA_OFFER_FORM_DEFAULTS, indiaOfferFormSchema } from "./india-offer.schema";
import type { IndiaOfferFormCopy, IndiaOfferFormValues } from "./india-offer.types";
import { OfferCaptcha } from "./OfferCaptcha";
import { OfferStatusAlert } from "./OfferStatusAlert";

const SUBMIT_CLASSES =
  "inner-action inner-action--primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-70";
const input = (invalid?: unknown) => inputClassName("blue", Boolean(invalid));

interface IndiaOfferFormProps {
  /** The packages on offer (the page's plans); their ids are the `plan` values sent. */
  plans: readonly OfferPlan[];
  copy: IndiaOfferFormCopy;
}

/**
 * The India offer lead form (React Hook Form + Zod), validated in the browser before it sends.
 * The plans and every word are the CMS page's props.
 */
export function IndiaOfferForm({ plans, copy }: Readonly<IndiaOfferFormProps>) {
  const schema = useMemo(() => indiaOfferFormSchema(copy.messages), [copy.messages]);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<IndiaOfferFormValues>({
    resolver: zodResolver(schema),
    defaultValues: INDIA_OFFER_FORM_DEFAULTS,
    mode: "onTouched",
  });
  const { captcha, captchaError, refreshCaptcha, status, submit } = useCaptchaSubmit(
    "india-offer",
    () => reset(),
    {
      incorrectAnswer: copy.status.incorrect,
      loading: copy.status.loading,
      loadFailed: copy.status.loadFailed,
      successResetMs: 6000,
    }
  );
  const { fields } = copy;

  const onSubmit = ({ captcha: answer, ...payload }: IndiaOfferFormValues) =>
    submit(answer, payload);

  return (
    <div>
      <OfferStatusAlert status={status} success={copy.success} failed={copy.status.failed} />

      <form className="grid gap-5 sm:grid-cols-2" noValidate onSubmit={handleSubmit(onSubmit)}>
        <FormField
          id="offer-name"
          label={fields.name.label}
          marker="required"
          error={errors.name?.message}
        >
          <input
            type="text"
            id="offer-name"
            autoComplete="name"
            placeholder={fields.name.placeholder}
            aria-invalid={Boolean(errors.name)}
            className={input(errors.name)}
            {...register("name")}
          />
        </FormField>

        <FormField
          id="offer-phone"
          label={fields.phone.label}
          marker="required"
          error={errors.phone?.message}
        >
          <input
            type="tel"
            id="offer-phone"
            autoComplete="tel-national"
            inputMode="numeric"
            placeholder={fields.phone.placeholder}
            maxLength={10}
            aria-invalid={Boolean(errors.phone)}
            className={input(errors.phone)}
            {...register("phone")}
          />
        </FormField>

        <FormField
          id="offer-email"
          label={fields.email.label}
          marker="required"
          error={errors.email?.message}
        >
          <input
            type="email"
            id="offer-email"
            autoComplete="email"
            placeholder={fields.email.placeholder}
            aria-invalid={Boolean(errors.email)}
            className={input(errors.email)}
            {...register("email")}
          />
        </FormField>

        <FormField
          id="offer-business"
          label={fields.business.label}
          error={errors.business?.message}
        >
          <input
            type="text"
            id="offer-business"
            autoComplete="organization"
            placeholder={fields.business.placeholder}
            aria-invalid={Boolean(errors.business)}
            className={input(errors.business)}
            {...register("business")}
          />
        </FormField>

        <div className="sm:col-span-2">
          <FormField
            id="offer-plan"
            label={copy.plan.label}
            marker="required"
            error={errors.plan?.message}
          >
            <select
              id="offer-plan"
              defaultValue=""
              aria-invalid={Boolean(errors.plan)}
              className={input(errors.plan)}
              {...register("plan")}
            >
              <option value="" disabled>
                {copy.plan.placeholder}
              </option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {planOptionLabel(plan, copy.popularShort)}
                </option>
              ))}
              <option value="custom">{copy.customPlan}</option>
            </select>
          </FormField>
        </div>

        <div className="sm:col-span-2">
          <FormField
            id="offer-message"
            label={fields.message.label}
            error={errors.message?.message}
          >
            <textarea
              id="offer-message"
              rows={3}
              placeholder={fields.message.placeholder}
              aria-invalid={Boolean(errors.message)}
              className={`${input(errors.message)} resize-y`}
              {...register("message")}
            />
          </FormField>
        </div>

        <div className="sm:col-span-2">
          <OfferCaptcha
            question={captcha.question}
            registration={register("captcha")}
            error={errors.captcha?.message}
            captchaError={captchaError}
            onRefresh={refreshCaptcha}
            copy={copy.captcha}
          />
        </div>

        <div className="sm:col-span-2">
          <SubmitButton
            isSubmitting={isSubmitting}
            className={SUBMIT_CLASSES}
            label={copy.submit}
            busyLabel={copy.sending}
          />
        </div>
      </form>
    </div>
  );
}
