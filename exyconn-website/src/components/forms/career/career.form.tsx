import { useState } from "react";
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
import { CAREER_FORM_DEFAULTS, careerFormSchema } from "./career.schema";
import type { CareerFormValues } from "./career.types";
import { ResumeField } from "./ResumeField";

const SUBMIT_CLASSES =
  "cursor-pointer w-full bg-blue-strong text-on-solid font-semibold py-4 px-6 rounded-xl hover:bg-blue-deep focus:ring-4 focus:ring-blue-muted transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";

/** The job application form (React Hook Form + Zod), validated in the browser before it sends. */
export function CareerFormReact() {
  const [resume, setResume] = useState<File | null>(null);
  const [resumeErr, setResumeErr] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CareerFormValues>({
    resolver: zodResolver(careerFormSchema),
    defaultValues: CAREER_FORM_DEFAULTS,
    mode: "onTouched",
  });
  const { captcha, captchaError, refreshCaptcha, status, submit } = useCaptchaSubmit(
    "career",
    () => {
      reset();
      setResume(null);
    }
  );

  const onResumeChange = (file: File | null, error: string) => {
    setResume(file);
    setResumeErr(error);
  };

  const onSubmit = async ({ captcha: answer, ...payload }: CareerFormValues) => {
    if (!resume) {
      setResumeErr("Please upload your resume");
      return;
    }
    await submit(answer, { ...payload, resumeName: resume.name });
  };

  return (
    <div
      className="bg-surface rounded-2xl shadow-xl p-8 max-w-2xl mx-auto mt-20"
      id="apply-now-form"
    >
      <h3 className="text-2xl font-bold text-[var(--color-primary)] mb-6 text-center">Apply Now</h3>

      <SubmitStatusAlert
        status={status}
        successMessage="Thank you! Your application has been submitted successfully."
      />

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid md:grid-cols-2 gap-4">
          <FormField id="name" label="Full Name" marker="required" error={errors.name?.message}>
            <input
              type="text"
              id="name"
              placeholder="Your full name"
              autoComplete="name"
              className={inputClassName("blue", Boolean(errors.name))}
              {...register("name")}
            />
          </FormField>
          <FormField id="email" label="Email" marker="required" error={errors.email?.message}>
            <input
              type="email"
              id="email"
              placeholder="you@example.com"
              autoComplete="email"
              className={inputClassName("blue", Boolean(errors.email))}
              {...register("email")}
            />
          </FormField>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <FormField id="phone" label="Phone" marker="optional" error={errors.phone?.message}>
            <input
              type="tel"
              id="phone"
              placeholder="+1 (555) 000-0000"
              autoComplete="tel"
              className={inputClassName("blue")}
              {...register("phone")}
            />
          </FormField>
          <FormField
            id="jobId"
            label="Position Applied For (Job ID)"
            marker="required"
            error={errors.jobId?.message}
          >
            <input
              type="text"
              id="jobId"
              placeholder="e.g., EXY-2024-001"
              className={inputClassName("blue", Boolean(errors.jobId))}
              {...register("jobId")}
            />
          </FormField>
        </div>

        <ResumeField file={resume} error={resumeErr} onChange={onResumeChange} />

        <FormField
          id="message"
          label="Cover Letter / Message"
          marker="optional"
          error={errors.message?.message}
        >
          <textarea
            id="message"
            rows={4}
            placeholder="Tell us why you'd be a great fit for this role..."
            className={`${inputClassName("blue")} resize-none`}
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
          label="Submit Application"
          busyLabel="Submitting..."
        />
      </form>
    </div>
  );
}
