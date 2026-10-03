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
} from "../legal/legal-form.styles";
import { GRIEVANCE_FORM_DEFAULTS, grievanceFormSchema } from "./grievance.schema";
import type { GrievanceFormValues } from "./grievance.types";

/**
 * The grievance page form (React Hook Form + Zod), validated in the browser before it sends.
 * It sits under the page's "Submit your grievance" section heading, so it has none of its own.
 */
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
    <div className={FORM_CLASS}>
      <SubmitStatusAlert
        status={status}
        successMessage="Your grievance has been submitted. We will review it and get back to you."
      />

      <form aria-label="Grievance" onSubmit={handleSubmit(onSubmit)}>
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

        <FormField id="subject" label="Subject" marker="required" error={errors.subject?.message}>
          <input
            type="text"
            id="subject"
            placeholder="Brief description of your grievance"
            aria-invalid={Boolean(errors.subject)}
            className={CONTROL_CLASS}
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
            aria-invalid={Boolean(errors.message)}
            className={CONTROL_CLASS}
            {...register("message")}
          />
        </FormField>

        <div className={CAPTCHA_CLASS}>
          <CaptchaField
            question={captcha.question}
            registration={register("captcha")}
            error={errors.captcha?.message}
            captchaError={captchaError}
            onRefresh={refreshCaptcha}
            accent="blue"
          />
        </div>

        <SubmitButton
          isSubmitting={isSubmitting}
          className={SUBMIT_CLASS}
          label="Submit Grievance"
          busyLabel="Submitting..."
        />
      </form>

      <p className={FINE_PRINT_CLASS}>
        By submitting, you agree that your grievance will be reviewed in accordance with Exyconn's
        grievance redressal policy.
      </p>
    </div>
  );
}
