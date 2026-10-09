import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CaptchaField, SubmitButton } from "../../forms/shared";
import { CAPTCHA_CLASS, FORM_CLASS, SUBMIT_CLASS } from "../../forms/legal/legal-form.styles";
import { APPLY_COPY as copy } from "../../../lib/career/copy";
import { fill } from "../../../lib/career/format";
import { AboutFields, ExperienceFields, LinkFields, PersonalFields } from "./sections";
import { JOB_APPLICATION_DEFAULTS, jobApplicationSchema } from "./job-application.schema";
import type { JobApplicationRole, JobApplicationValues } from "./job-application.types";
import { ResumeInput } from "./ResumeInput";
import { useApplicationSubmit } from "./useApplicationSubmit";
import "../career.css";

type Props = Readonly<JobApplicationRole>;

/** The success panel that replaces the form once the portal has the application. */
function Sent({ jobTitle, companyName, companySlug }: Props) {
  return (
    <output className={`${FORM_CLASS} job-apply__sent`}>
      <p className="stage-label">{copy.successTitle}</p>
      <p className="inner-h3">
        {fill(copy.successText, { title: jobTitle, company: companyName })}
      </p>
      <a href={`/career/company/${companySlug}`} className="inner-action inner-action--ghost">
        {fill(copy.successAction, { company: companyName })}
      </a>
    </output>
  );
}

/**
 * The job application (React Hook Form + Zod): validated in the browser, then sent with the
 * résumé file to /api/job-application, which hands both to the portal.
 */
export function JobApplicationForm(role: Props) {
  const [resume, setResume] = useState<File | null>(null);
  const [resumeErr, setResumeErr] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<JobApplicationValues>({
    resolver: zodResolver(jobApplicationSchema),
    defaultValues: JOB_APPLICATION_DEFAULTS,
    mode: "onTouched",
  });
  const { captcha, captchaError, refreshCaptcha, status, submit } = useApplicationSubmit(role, () =>
    setResumeErr(copy.resumeRefused)
  );

  const onResumeChange = (file: File | null, error: string) => {
    setResume(file);
    setResumeErr(error);
  };

  const onSubmit = async ({
    captcha: answer,
    consent: _agreed,
    ...fields
  }: JobApplicationValues) => {
    if (!resume) {
      setResumeErr("Please attach your résumé");
      return;
    }
    await submit(answer, fields, resume);
  };

  // Checked on every submit attempt, so a missing file is reported with the other fields.
  const onInvalid = () => {
    if (!resume) setResumeErr("Please attach your résumé");
  };

  if (status === "sent") {
    return <Sent {...role} />;
  }

  return (
    <div className={`${FORM_CLASS} job-apply`}>
      <form aria-label={copy.formLabel} noValidate onSubmit={handleSubmit(onSubmit, onInvalid)}>
        <PersonalFields register={register} errors={errors} />
        <ExperienceFields register={register} errors={errors} />
        <fieldset className="job-apply__group">
          <legend className="stage-label">{copy.links}</legend>
          <ResumeInput
            label={copy.resume}
            hint={copy.resumeHint}
            empty={copy.resumeNone}
            choose={copy.resumeChoose}
            change={copy.resumeChange}
            file={resume}
            error={resumeErr}
            onChange={onResumeChange}
          />
          <LinkFields register={register} errors={errors} />
        </fieldset>
        <AboutFields register={register} errors={errors} companyName={role.companyName} />

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

        {status === "failed" && (
          <p role="alert" className="text-red-fg text-sm">
            {copy.failed}
          </p>
        )}
        <SubmitButton
          isSubmitting={isSubmitting}
          className={SUBMIT_CLASS}
          label={copy.submit}
          busyLabel={copy.busy}
        />
      </form>
    </div>
  );
}
