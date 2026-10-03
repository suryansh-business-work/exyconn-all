import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormField, SubmitButton, inputClassName, useCaptchaSubmit } from "../shared";
import { OFFER_PLANS, planOptionLabel } from "../../../lib/india/plans";
import { OFFER_PRICING } from "../../../lib/india/offer";
import { INDIA_OFFER_FORM_DEFAULTS, indiaOfferFormSchema } from "./india-offer.schema";
import type { IndiaOfferFormValues } from "./india-offer.types";
import { OfferCaptcha } from "./OfferCaptcha";
import { OfferStatusAlert } from "./OfferStatusAlert";

const CAPTCHA_OPTIONS = { incorrectAnswer: "गलत जवाब — दोबारा कोशिश करें", successResetMs: 6000 };
const SUBMIT_CLASSES =
  "inner-action inner-action--primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-70";
const input = (invalid?: unknown) => inputClassName("blue", Boolean(invalid));

/** The India offer lead form (React Hook Form + Zod), validated in the browser before it sends. */
export function IndiaOfferForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<IndiaOfferFormValues>({
    resolver: zodResolver(indiaOfferFormSchema),
    defaultValues: INDIA_OFFER_FORM_DEFAULTS,
    mode: "onTouched",
  });
  const { captcha, captchaError, refreshCaptcha, status, submit } = useCaptchaSubmit(
    "india-offer",
    () => reset(),
    CAPTCHA_OPTIONS
  );

  const onSubmit = ({ captcha: answer, ...payload }: IndiaOfferFormValues) =>
    submit(answer, payload);

  return (
    <div>
      <OfferStatusAlert status={status} />

      <form className="grid gap-5 sm:grid-cols-2" noValidate onSubmit={handleSubmit(onSubmit)}>
        <FormField id="offer-name" label="आपका नाम" marker="required" error={errors.name?.message}>
          <input
            type="text"
            id="offer-name"
            autoComplete="name"
            placeholder="अपना पूरा नाम लिखें"
            aria-invalid={Boolean(errors.name)}
            className={input(errors.name)}
            {...register("name")}
          />
        </FormField>

        <FormField
          id="offer-phone"
          label="फ़ोन नंबर"
          marker="required"
          error={errors.phone?.message}
        >
          <input
            type="tel"
            id="offer-phone"
            autoComplete="tel-national"
            inputMode="numeric"
            placeholder="9876543210"
            maxLength={10}
            aria-invalid={Boolean(errors.phone)}
            className={input(errors.phone)}
            {...register("phone")}
          />
        </FormField>

        <FormField id="offer-email" label="ईमेल" marker="required" error={errors.email?.message}>
          <input
            type="email"
            id="offer-email"
            autoComplete="email"
            placeholder="aapka@email.com"
            aria-invalid={Boolean(errors.email)}
            className={input(errors.email)}
            {...register("email")}
          />
        </FormField>

        <FormField id="offer-business" label="बिज़नेस का नाम" error={errors.business?.message}>
          <input
            type="text"
            id="offer-business"
            autoComplete="organization"
            placeholder="आपकी कंपनी / दुकान का नाम"
            aria-invalid={Boolean(errors.business)}
            className={input(errors.business)}
            {...register("business")}
          />
        </FormField>

        <div className="sm:col-span-2">
          <FormField
            id="offer-plan"
            label="कौनसा प्लान चाहिए?"
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
                — प्लान चुनें —
              </option>
              {OFFER_PLANS.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {planOptionLabel(plan, OFFER_PRICING.popularShort)}
                </option>
              ))}
              <option value="custom">मुझे सलाह चाहिए</option>
            </select>
          </FormField>
        </div>

        <div className="sm:col-span-2">
          <FormField id="offer-message" label="कुछ और बताना है?" error={errors.message?.message}>
            <textarea
              id="offer-message"
              rows={3}
              placeholder="अपनी ज़रूरत यहाँ लिखें..."
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
          />
        </div>

        <div className="sm:col-span-2">
          <SubmitButton
            isSubmitting={isSubmitting}
            className={SUBMIT_CLASSES}
            label="अभी भेजें"
            busyLabel="भेज रहे हैं..."
          />
        </div>
      </form>
    </div>
  );
}
