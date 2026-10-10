import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CaptchaField, FormField, SubmitButton, inputClassName } from "../shared";
import { fetchCaptcha, type CaptchaChallenge } from "../shared/postFormSubmission";
import { DemoStepError, sendDemoCode } from "./demoApi";
import { DEMO_LEAD_DEFAULTS, demoLeadSchema } from "./whatsapp-demo.schema";
import type { DemoLeadValues } from "./whatsapp-demo.types";

const SUBMIT_CLASS = "inner-action inner-action--primary w-full justify-center";
const LOADING_QUESTION = { token: "", question: "Loading…" };

interface DemoLeadFormProps {
  /** Called with the address the code went to. */
  onCodeSent: (email: string) => void;
}

/**
 * Step one of the live WhatsApp demo (React Hook Form + Zod): name, work email, company and
 * phone, plus the website's security question. Sends the "thank you for your live demo" email
 * with a six-digit code.
 */
export function DemoLeadForm({ onCodeSent }: Readonly<DemoLeadFormProps>) {
  const [captcha, setCaptcha] = useState<CaptchaChallenge>(LOADING_QUESTION);
  const [captchaError, setCaptchaError] = useState("");
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DemoLeadValues>({
    resolver: zodResolver(demoLeadSchema),
    defaultValues: DEMO_LEAD_DEFAULTS,
    mode: "onTouched",
  });

  const loadCaptcha = useCallback(async () => {
    try {
      setCaptcha(await fetchCaptcha());
    } catch (err) {
      console.error("The security question could not be loaded", err);
      setCaptchaError("The security question could not be loaded. Please refresh it.");
    }
  }, []);

  // After mount: a question in the server-rendered HTML would be shared by every visitor.
  useEffect(() => {
    loadCaptcha().catch((err: unknown) => console.error(err));
  }, [loadCaptcha]);

  const onSubmit = async ({ captcha: answer, ...lead }: DemoLeadValues) => {
    setError("");
    setCaptchaError("");
    try {
      await sendDemoCode({ ...lead, captchaToken: captcha.token, captchaAnswer: answer });
      onCodeSent(lead.email.trim().toLowerCase());
    } catch (err) {
      const refused = err instanceof DemoStepError;
      if (refused && err.captcha) {
        setCaptchaError(err.message);
      } else {
        setError(refused ? err.message : "Something went wrong. Please try again.");
      }
      await loadCaptcha();
    }
  };

  return (
    <form aria-label="Request live demo access" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="demo-name" label="Your name" marker="required" error={errors.name?.message}>
          <input
            id="demo-name"
            type="text"
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            className={inputClassName("blue", Boolean(errors.name))}
            {...register("name")}
          />
        </FormField>
        <FormField
          id="demo-email"
          label="Work email"
          marker="required"
          error={errors.email?.message}
        >
          <input
            id="demo-email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            className={inputClassName("blue", Boolean(errors.email))}
            {...register("email")}
          />
        </FormField>
        <FormField
          id="demo-company"
          label="Company"
          marker="optional"
          error={errors.company?.message}
        >
          <input
            id="demo-company"
            type="text"
            autoComplete="organization"
            aria-invalid={Boolean(errors.company)}
            className={inputClassName("blue", Boolean(errors.company))}
            {...register("company")}
          />
        </FormField>
        <FormField id="demo-phone" label="Phone" marker="optional" error={errors.phone?.message}>
          <input
            id="demo-phone"
            type="tel"
            autoComplete="tel"
            aria-invalid={Boolean(errors.phone)}
            className={inputClassName("blue", Boolean(errors.phone))}
            {...register("phone")}
          />
        </FormField>
      </div>
      <div className="mt-5">
        <CaptchaField
          question={captcha.question}
          registration={register("captcha")}
          error={errors.captcha?.message}
          captchaError={captchaError}
          onRefresh={() => {
            setCaptchaError("");
            loadCaptcha().catch((err: unknown) => console.error(err));
          }}
          accent="blue"
        />
      </div>
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-fg">
          {error}
        </p>
      )}
      <div className="mt-6">
        <SubmitButton
          isSubmitting={isSubmitting}
          className={SUBMIT_CLASS}
          label="Email me my demo code"
          busyLabel="Sending your code…"
        />
      </div>
      <p className="mt-3 text-xs text-fg-subtle">
        We email a one-time code — no password. Your details stay with Exyconn and are used to
        follow up on your demo.
      </p>
    </form>
  );
}
