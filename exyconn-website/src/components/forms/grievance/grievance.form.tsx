import { useMemo } from "react";
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
import type { GrievanceFormCopy, GrievanceFormValues } from "./grievance.types";

/**
 * The grievance page form (React Hook Form + Zod), validated in the browser before it sends.
 * It sits under the page's "Submit your grievance" section heading, so it has none of its own.
 * Every word, validation messages included, is the CMS page's copy.
 */
export function GrievanceFormReact({ copy }: Readonly<{ copy: GrievanceFormCopy }>) {
  const schema = useMemo(() => grievanceFormSchema(copy.messages), [copy.messages]);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GrievanceFormValues>({
    resolver: zodResolver(schema),
    defaultValues: GRIEVANCE_FORM_DEFAULTS,
    mode: "onTouched",
  });
  const { captcha, captchaError, refreshCaptcha, status, submit } = useCaptchaSubmit(
    "grievance",
    () => reset(),
    {
      incorrectAnswer: copy.status.incorrect,
      loading: copy.status.loading,
      loadFailed: copy.status.loadFailed,
    }
  );
  const { fields } = copy;

  const onSubmit = ({ captcha: answer, ...payload }: GrievanceFormValues) =>
    submit(answer, payload);

  return (
    <div className={FORM_CLASS}>
      <SubmitStatusAlert
        status={status}
        successMessage={copy.success}
        errorMessage={copy.status.failed}
      />

      <form aria-label={copy.formLabel} onSubmit={handleSubmit(onSubmit)}>
        <div className={ROW_CLASS}>
          <FormField
            id="name"
            label={fields.name.label}
            marker="required"
            error={errors.name?.message}
          >
            <input
              type="text"
              id="name"
              autoComplete="name"
              placeholder={fields.name.placeholder}
              aria-invalid={Boolean(errors.name)}
              className={CONTROL_CLASS}
              {...register("name")}
            />
          </FormField>

          <FormField
            id="email"
            label={fields.email.label}
            marker="required"
            error={errors.email?.message}
          >
            <input
              type="email"
              id="email"
              autoComplete="email"
              placeholder={fields.email.placeholder}
              aria-invalid={Boolean(errors.email)}
              className={CONTROL_CLASS}
              {...register("email")}
            />
          </FormField>
        </div>

        <FormField
          id="subject"
          label={fields.subject.label}
          marker="required"
          error={errors.subject?.message}
        >
          <input
            type="text"
            id="subject"
            placeholder={fields.subject.placeholder}
            aria-invalid={Boolean(errors.subject)}
            className={CONTROL_CLASS}
            {...register("subject")}
          />
        </FormField>

        <FormField
          id="message"
          label={fields.message.label}
          marker="required"
          error={errors.message?.message}
        >
          <textarea
            id="message"
            rows={6}
            placeholder={fields.message.placeholder}
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
            copy={copy.captcha}
          />
        </div>

        <SubmitButton
          isSubmitting={isSubmitting}
          className={SUBMIT_CLASS}
          label={copy.submit}
          busyLabel={copy.sending}
        />
      </form>

      <p className={FINE_PRINT_CLASS}>{copy.finePrint}</p>
    </div>
  );
}
