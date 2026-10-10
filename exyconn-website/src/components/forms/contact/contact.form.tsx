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
  ROW_CLASS,
  SUBMIT_CLASS,
} from "../legal/legal-form.styles";
import "./contact-form.css";
import { CONTACT_FORM_DEFAULTS, contactFormSchema } from "./contact.schema";
import type { ContactFormCopy, ContactFormValues } from "./contact.types";

/** The page's panel (SplitFormShell) frames the form; this only sets the field idiom. */
const FORM_CLASS = "legal-form contact-form";

/**
 * The contact page form (React Hook Form + Zod), validated in the browser before it sends.
 * Every word, validation messages included, is the CMS page's copy.
 */
export function ContactFormReact({ copy }: Readonly<{ copy: ContactFormCopy }>) {
  const schema = useMemo(() => contactFormSchema(copy.messages), [copy.messages]);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(schema),
    defaultValues: CONTACT_FORM_DEFAULTS,
    mode: "onTouched",
  });
  const { captcha, captchaError, refreshCaptcha, status, submit } = useCaptchaSubmit(
    "contact",
    () => reset(),
    {
      incorrectAnswer: copy.status.incorrect,
      loading: copy.status.loading,
      loadFailed: copy.status.loadFailed,
    }
  );
  const { fields } = copy;

  const onSubmit = ({ captcha: answer, ...payload }: ContactFormValues) => submit(answer, payload);

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
            id="firstName"
            label={fields.firstName.label}
            marker="required"
            error={errors.firstName?.message}
          >
            <input
              type="text"
              id="firstName"
              autoComplete="given-name"
              placeholder={fields.firstName.placeholder}
              aria-invalid={Boolean(errors.firstName)}
              className={CONTROL_CLASS}
              {...register("firstName")}
            />
          </FormField>
          <FormField
            id="lastName"
            label={fields.lastName.label}
            marker="required"
            error={errors.lastName?.message}
          >
            <input
              type="text"
              id="lastName"
              autoComplete="family-name"
              placeholder={fields.lastName.placeholder}
              aria-invalid={Boolean(errors.lastName)}
              className={CONTROL_CLASS}
              {...register("lastName")}
            />
          </FormField>
        </div>

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

        <FormField id="company" label={fields.company.label} error={errors.company?.message}>
          <input
            type="text"
            id="company"
            autoComplete="organization"
            placeholder={fields.company.placeholder}
            aria-invalid={Boolean(errors.company)}
            className={CONTROL_CLASS}
            {...register("company")}
          />
        </FormField>

        <FormField
          id="subject"
          label={copy.subject.label}
          marker="required"
          error={errors.subject?.message}
        >
          <select
            id="subject"
            defaultValue=""
            aria-invalid={Boolean(errors.subject)}
            className={CONTROL_CLASS}
            {...register("subject")}
          >
            <option value="" disabled>
              {copy.subject.placeholder}
            </option>
            {copy.subjects.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          id="message"
          label={fields.message.label}
          marker="required"
          error={errors.message?.message}
        >
          <textarea
            id="message"
            rows={4}
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

        <p className={FINE_PRINT_CLASS}>
          {copy.finePrint.text}{" "}
          <a href={copy.finePrint.linkHref} className="underline">
            {copy.finePrint.linkLabel}
          </a>
          {copy.finePrint.after}
        </p>
      </form>
    </div>
  );
}
