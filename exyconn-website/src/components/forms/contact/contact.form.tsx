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
import { CONTACT_FORM_DEFAULTS, contactFormSchema } from "./contact.schema";
import type { ContactFormValues } from "./contact.types";

const SUBMIT_CLASSES =
  "cursor-pointer w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-strong to-purple-strong text-on-solid font-semibold px-8 py-4 rounded-xl hover:opacity-90 transition-all duration-300 shadow-lg shadow-blue/20 disabled:opacity-50 disabled:cursor-not-allowed";

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
    <div className="bg-surface rounded-3xl border border-line-subtle shadow-xl shadow-surface-muted/50 p-8 lg:p-10">
      <SubmitStatusAlert
        status={status}
        successMessage="Thank you! Your message has been sent successfully."
      />

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid sm:grid-cols-2 gap-5">
          <FormField
            id="firstName"
            label="First Name"
            marker="required"
            error={errors.firstName?.message}
          >
            <input
              type="text"
              id="firstName"
              placeholder="John"
              className={inputClassName("blue", Boolean(errors.firstName))}
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
              placeholder="Doe"
              className={inputClassName("blue", Boolean(errors.lastName))}
              {...register("lastName")}
            />
          </FormField>
        </div>

        <FormField id="email" label="Email Address" marker="required" error={errors.email?.message}>
          <input
            type="email"
            id="email"
            placeholder="john@example.com"
            className={inputClassName("blue", Boolean(errors.email))}
            {...register("email")}
          />
        </FormField>

        <FormField id="company" label="Company Name" error={errors.company?.message}>
          <input
            type="text"
            id="company"
            placeholder="Your company"
            className={inputClassName("blue")}
            {...register("company")}
          />
        </FormField>

        <FormField id="subject" label="Subject" marker="required" error={errors.subject?.message}>
          <select
            id="subject"
            defaultValue=""
            className={inputClassName("blue", Boolean(errors.subject))}
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
          label="Send Message"
          busyLabel="Sending..."
        />

        <p className="text-center text-xs text-fg-subtle">
          By submitting this form, you agree to our{" "}
          <a href="/privacy-policy" className="text-blue-fg hover:underline">
            Privacy Policy
          </a>
          .
        </p>
      </form>
    </div>
  );
}
