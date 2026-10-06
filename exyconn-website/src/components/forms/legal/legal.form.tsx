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
} from "./legal-form.styles";
import { LEGAL_FORM_DEFAULTS, legalFormSchema } from "./legal.schema";
import type { LegalFormCopy, LegalFormValues } from "./legal.types";

/**
 * The legal request form (React Hook Form + Zod), validated in the browser before it sends.
 * It sits under the page's "Submit a request" section heading, so it has none of its own.
 * Every word, validation messages included, is the CMS page's copy.
 */
export function LegalFormReact({ copy }: Readonly<{ copy: LegalFormCopy }>) {
  const schema = useMemo(() => legalFormSchema(copy.messages), [copy.messages]);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LegalFormValues>({
    resolver: zodResolver(schema),
    defaultValues: LEGAL_FORM_DEFAULTS,
    mode: "onTouched",
  });
  const { captcha, captchaError, refreshCaptcha, status, submit } = useCaptchaSubmit(
    "legal",
    () => reset(),
    {
      incorrectAnswer: copy.status.incorrect,
      loading: copy.status.loading,
      loadFailed: copy.status.loadFailed,
    }
  );
  const { fields } = copy;

  const onSubmit = ({ captcha: answer, ...payload }: LegalFormValues) => submit(answer, payload);

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
          id="legalType"
          label={copy.type.label}
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
            {[{ value: "", label: copy.type.placeholder }, ...copy.types].map((option) => (
              <option key={option.value} value={option.value} disabled={option.value === ""}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField id="url" label={fields.url.label} error={errors.url?.message}>
          <input
            type="text"
            id="url"
            inputMode="url"
            placeholder={fields.url.placeholder}
            aria-invalid={Boolean(errors.url)}
            className={CONTROL_CLASS}
            {...register("url")}
          />
        </FormField>

        <FormField
          id="details"
          label={fields.details.label}
          marker="required"
          error={errors.details?.message}
        >
          <textarea
            id="details"
            rows={6}
            placeholder={fields.details.placeholder}
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
