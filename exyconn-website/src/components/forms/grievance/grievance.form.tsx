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
import { GRIEVANCE_FORM_DEFAULTS, grievanceFormSchema } from "./grievance.schema";
import type { GrievanceFormValues } from "./grievance.types";

const SUBMIT_CLASSES =
  "cursor-pointer w-full bg-gradient-to-r from-blue-strong to-purple-strong text-on-solid font-semibold py-4 px-6 rounded-xl hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue/20";

/** The grievance page form (React Hook Form + Zod), validated in the browser before it sends. */
export function GrievanceFormReact() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GrievanceFormValues>({
    resolver: zodResolver(grievanceFormSchema),
    defaultValues: GRIEVANCE_FORM_DEFAULTS,
    mode: "onTouched",
  });
  const { captcha, captchaError, refreshCaptcha, status, submit } = useCaptchaSubmit(
    "grievance",
    () => reset()
  );

  const onSubmit = ({ captcha: answer, ...payload }: GrievanceFormValues) =>
    submit(answer, payload);

  return (
    <section className="max-w-xl mx-auto mt-12 rounded-xl p-5">
      <div className="bg-surface rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-[var(--color-primary)] mb-6 text-center">
          Submit Your Grievance
        </h2>

        <SubmitStatusAlert
          status={status}
          successMessage="Your grievance has been submitted. We will review it and get back to you."
        />

        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <FormField id="name" label="Your Name" marker="required" error={errors.name?.message}>
            <input
              type="text"
              id="name"
              placeholder="Enter your full name"
              className={inputClassName("blue", Boolean(errors.name))}
              {...register("name")}
            />
          </FormField>

          <FormField id="email" label="Your Email" marker="required" error={errors.email?.message}>
            <input
              type="email"
              id="email"
              placeholder="you@example.com"
              className={inputClassName("blue", Boolean(errors.email))}
              {...register("email")}
            />
          </FormField>

          <FormField id="subject" label="Subject" marker="required" error={errors.subject?.message}>
            <input
              type="text"
              id="subject"
              placeholder="Brief description of your grievance"
              className={inputClassName("blue", Boolean(errors.subject))}
              {...register("subject")}
            />
          </FormField>

          <FormField
            id="message"
            label="Grievance Details"
            marker="required"
            error={errors.message?.message}
          >
            <textarea
              id="message"
              rows={6}
              placeholder="Please provide detailed information about your grievance..."
              className={`${inputClassName("blue", Boolean(errors.message))} resize-none`}
              {...register("message")}
            />
          </FormField>

          <CaptchaField
            question={captcha.question}
            registration={register("captcha")}
            error={errors.captcha?.message}
            captchaError={captchaError}
            onRefresh={refreshCaptcha}
            accent="blue"
          />

          <SubmitButton
            isSubmitting={isSubmitting}
            className={SUBMIT_CLASSES}
            label="Submit Grievance"
            busyLabel="Submitting..."
          />
        </form>

        <p className="text-xs text-fg-subtle mt-4 text-center">
          By submitting, you agree that your grievance will be reviewed in accordance with Exyconn's
          grievance redressal policy.
        </p>
      </div>
    </section>
  );
}
