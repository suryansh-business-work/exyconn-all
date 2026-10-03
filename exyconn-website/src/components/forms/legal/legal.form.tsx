import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CaptchaField,
  FormField,
  SubmitButton,
  SubmitStatusAlert,
  useCaptchaSubmit,
} from "../shared";
import {
  CAPTCHA_CLASS,
  CONTROL_CLASS,
  FINE_PRINT_CLASS,
  FORM_CLASS,
  ROW_CLASS,
  SUBMIT_CLASS,
} from "./legal-form.styles";
import { LEGAL_FORM_DEFAULTS, legalFormSchema } from "./legal.schema";
import type { LegalFormValues } from "./legal.types";

const legalOptions = [
  { value: "", label: "Select an option" },
  { value: "copyright", label: "Copyright Infringement" },
  { value: "image-takedown", label: "Image Takedown Request" },
  { value: "content-takedown", label: "Content Takedown Request" },
  { value: "trademark", label: "Trademark Concern" },
  { value: "privacy", label: "Privacy/Data Request" },
  { value: "other", label: "Other Legal Issue" },
];

/**
 * The legal request form (React Hook Form + Zod), validated in the browser before it sends.
 * It sits under the page's "Submit a request" section heading, so it has none of its own.
 */
export function LegalFormReact() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LegalFormValues>({
    resolver: zodResolver(legalFormSchema),
    defaultValues: LEGAL_FORM_DEFAULTS,
    mode: "onTouched",
  });
  const { captcha, captchaError, refreshCaptcha, status, submit } = useCaptchaSubmit("legal", () =>
    reset()
  );

  const onSubmit = ({ captcha: answer, ...payload }: LegalFormValues) => submit(answer, payload);

  return (
    <div className={FORM_CLASS}>
      <SubmitStatusAlert
        status={status}
        successMessage="Your legal request has been submitted. We will review it and respond promptly."
      />

      <form aria-label="Legal request" onSubmit={handleSubmit(onSubmit)}>
        <div className={ROW_CLASS}>
          <FormField id="name" label="Your Name" marker="required" error={errors.name?.message}>
            <input
              type="text"
              id="name"
              autoComplete="name"
              placeholder="Enter your full name"
              aria-invalid={Boolean(errors.name)}
              className={CONTROL_CLASS}
              {...register("name")}
            />
          </FormField>

          <FormField id="email" label="Your Email" marker="required" error={errors.email?.message}>
            <input
              type="email"
              id="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={Boolean(errors.email)}
              className={CONTROL_CLASS}
              {...register("email")}
            />
          </FormField>
        </div>

        <FormField
          id="legalType"
          label="Type of Legal Request"
          marker="required"
          error={errors.legalType?.message}
        >
          <select
            id="legalType"
            defaultValue=""
            aria-invalid={Boolean(errors.legalType)}
            className={CONTROL_CLASS}
            {...register("legalType")}
          >
            {legalOptions.map((option) => (
              <option key={option.value} value={option.value} disabled={option.value === ""}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField id="url" label="URL(s) of Concerned Content" error={errors.url?.message}>
          <input
            type="text"
            id="url"
            inputMode="url"
            placeholder="https://example.com/page-or-image"
            aria-invalid={Boolean(errors.url)}
            className={CONTROL_CLASS}
            {...register("url")}
          />
        </FormField>

        <FormField
          id="details"
          label="Details of Your Request"
          marker="required"
          error={errors.details?.message}
        >
          <textarea
            id="details"
            rows={6}
            placeholder="Describe your legal concern, including any supporting information or documentation."
            aria-invalid={Boolean(errors.details)}
            className={CONTROL_CLASS}
            {...register("details")}
          />
        </FormField>

        <div className={CAPTCHA_CLASS}>
          <CaptchaField
            question={captcha.question}
            registration={register("captcha")}
            error={errors.captcha?.message}
            captchaError={captchaError}
            onRefresh={refreshCaptcha}
            accent="amber"
          />
        </div>

        <SubmitButton
          isSubmitting={isSubmitting}
          className={SUBMIT_CLASS}
          label="Submit Legal Request"
          busyLabel="Submitting..."
        />
      </form>

      <p className={FINE_PRINT_CLASS}>
        By submitting, you confirm that the information provided is accurate and you have the
        authority to make this request. Exyconn will review and respond in accordance with
        applicable law and our policies.
      </p>
    </div>
  );
}
