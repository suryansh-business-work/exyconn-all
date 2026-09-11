import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CaptchaField,
  FormField,
  SubmitButton,
  SubmitStatusAlert,
  inputClassName,
  useCaptchaSubmit,
} from "../shared";
import { LEGAL_FORM_DEFAULTS, legalFormSchema } from "./legal.schema";
import type { LegalFormValues } from "./legal.types";

const SUBMIT_CLASSES =
  "cursor-pointer w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold py-4 px-6 rounded-xl hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20";

const legalOptions = [
  { value: "", label: "Select an option" },
  { value: "copyright", label: "Copyright Infringement" },
  { value: "image-takedown", label: "Image Takedown Request" },
  { value: "content-takedown", label: "Content Takedown Request" },
  { value: "trademark", label: "Trademark Concern" },
  { value: "privacy", label: "Privacy/Data Request" },
  { value: "other", label: "Other Legal Issue" },
];

/** The legal request form (React Hook Form + Zod), validated in the browser before it sends. */
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
    <section className="max-w-xl mx-auto mt-12 bg-white rounded-2xl shadow-xl p-8">
      <h2 className="text-2xl font-bold text-[var(--color-primary)] mb-6 text-center">
        Submit a Legal Request
      </h2>

      <SubmitStatusAlert
        status={status}
        successMessage="Your legal request has been submitted. We will review it and respond promptly."
      />

      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <FormField id="name" label="Your Name" marker="required" error={errors.name?.message}>
          <input
            type="text"
            id="name"
            placeholder="Enter your full name"
            className={inputClassName("amber", Boolean(errors.name))}
            {...register("name")}
          />
        </FormField>

        <FormField id="email" label="Your Email" marker="required" error={errors.email?.message}>
          <input
            type="email"
            id="email"
            placeholder="you@example.com"
            className={inputClassName("amber", Boolean(errors.email))}
            {...register("email")}
          />
        </FormField>

        <FormField
          id="legalType"
          label="Type of Legal Request"
          marker="required"
          error={errors.legalType?.message}
        >
          <select
            id="legalType"
            defaultValue=""
            className={inputClassName("amber", Boolean(errors.legalType))}
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
            placeholder="https://example.com/page-or-image"
            className={inputClassName("amber")}
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
            className={`${inputClassName("amber", Boolean(errors.details))} resize-none`}
            {...register("details")}
          />
        </FormField>

        <CaptchaField
          question={captcha.question}
          registration={register("captcha")}
          error={errors.captcha?.message}
          captchaError={captchaError}
          onRefresh={refreshCaptcha}
          accent="amber"
        />

        <SubmitButton
          isSubmitting={isSubmitting}
          className={SUBMIT_CLASSES}
          label="Submit Legal Request"
          busyLabel="Submitting..."
        />
      </form>

      <p className="text-xs text-gray-500 mt-4 text-center">
        By submitting, you confirm that the information provided is accurate and you have the
        authority to make this request. Exyconn will review and respond in accordance with
        applicable law and our policies.
      </p>
    </section>
  );
}
