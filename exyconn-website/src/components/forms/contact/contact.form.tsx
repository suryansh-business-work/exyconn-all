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
import type { ContactFormValues } from "./contact.types";

/** The page's panel (SplitFormShell) frames the form; this only sets the field idiom. */
const FORM_CLASS = "legal-form contact-form";

/** The contact page form (React Hook Form + Zod), validated in the browser before it sends. */
export function ContactFormReact() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: CONTACT_FORM_DEFAULTS,
    mode: "onTouched",
  });
  const { captcha, captchaError, refreshCaptcha, status, submit } = useCaptchaSubmit(
    "contact",
    () => reset()
  );

  const onSubmit = ({ captcha: answer, ...payload }: ContactFormValues) => submit(answer, payload);

  return (
    <div className={FORM_CLASS}>
      <SubmitStatusAlert
        status={status}
        successMessage="Thank you! Your message has been sent successfully."
      />

      <form aria-label="Contact form" onSubmit={handleSubmit(onSubmit)}>
        <div className={ROW_CLASS}>
          <FormField
            id="firstName"
            label="First Name"
            marker="required"
            error={errors.firstName?.message}
          >
            <input
              type="text"
              id="firstName"
              autoComplete="given-name"
              placeholder="John"
              aria-invalid={Boolean(errors.firstName)}
              className={CONTROL_CLASS}
              {...register("firstName")}
            />
          </FormField>
          <FormField
            id="lastName"
            label="Last Name"
            marker="required"
            error={errors.lastName?.message}
          >
            <input
              type="text"
              id="lastName"
              autoComplete="family-name"
              placeholder="Doe"
              aria-invalid={Boolean(errors.lastName)}
              className={CONTROL_CLASS}
              {...register("lastName")}
            />
          </FormField>
        </div>

        <FormField id="email" label="Email Address" marker="required" error={errors.email?.message}>
          <input
            type="email"
            id="email"
            autoComplete="email"
            placeholder="john@example.com"
            aria-invalid={Boolean(errors.email)}
            className={CONTROL_CLASS}
            {...register("email")}
          />
        </FormField>

        <FormField id="company" label="Company Name" error={errors.company?.message}>
          <input
            type="text"
            id="company"
            autoComplete="organization"
            placeholder="Your company"
            className={CONTROL_CLASS}
            {...register("company")}
          />
        </FormField>

        <FormField id="subject" label="Subject" marker="required" error={errors.subject?.message}>
          <select
            id="subject"
            defaultValue=""
            aria-invalid={Boolean(errors.subject)}
            className={CONTROL_CLASS}
            {...register("subject")}
          >
            <option value="" disabled>
              Select a topic
            </option>
            <option value="general">General Inquiry</option>
            <option value="project">Project Discussion</option>
            <option value="partnership">Partnership</option>
            <option value="support">Support</option>
            <option value="other">Other</option>
          </select>
        </FormField>

        <FormField id="message" label="Message" marker="required" error={errors.message?.message}>
          <textarea
            id="message"
            rows={4}
            placeholder="Tell us about your project..."
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
          label="Send Message"
          busyLabel="Sending..."
        />

        <p className={FINE_PRINT_CLASS}>
          By submitting this form, you agree to our{" "}
          <a href="/privacy-policy" className="underline">
            Privacy Policy
          </a>
          .
        </p>
      </form>
    </div>
  );
}
