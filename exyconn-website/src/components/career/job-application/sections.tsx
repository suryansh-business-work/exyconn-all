import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { FormField } from "../../forms/shared";
import { CONTROL_CLASS, ROW_CLASS } from "../../forms/legal/legal-form.styles";
import { APPLY_COPY as copy } from "../../../lib/career/copy";
import { fill } from "../../../lib/career/format";
import type { JobApplicationValues } from "./job-application.types";
import { SelectField, TextField } from "./fields";

interface SectionProps {
  register: UseFormRegister<JobApplicationValues>;
  errors: FieldErrors<JobApplicationValues>;
}

/** Name, email, phone and location. */
export function PersonalFields({ register, errors }: Readonly<SectionProps>) {
  return (
    <fieldset className="job-apply__group">
      <legend className="stage-label">{copy.personal}</legend>
      <div className={ROW_CLASS}>
        <TextField
          id="firstName"
          label={copy.firstName}
          marker="required"
          autoComplete="given-name"
          error={errors.firstName?.message}
          registration={register("firstName")}
        />
        <TextField
          id="lastName"
          label={copy.lastName}
          marker="required"
          autoComplete="family-name"
          error={errors.lastName?.message}
          registration={register("lastName")}
        />
      </div>
      <div className={ROW_CLASS}>
        <TextField
          id="email"
          type="email"
          label={copy.email}
          marker="required"
          autoComplete="email"
          error={errors.email?.message}
          registration={register("email")}
        />
        <TextField
          id="phone"
          type="tel"
          label={copy.phone}
          marker="required"
          autoComplete="tel"
          error={errors.phone?.message}
          registration={register("phone")}
        />
      </div>
      <TextField
        id="location"
        label={copy.location}
        marker="required"
        autoComplete="address-level2"
        placeholder={copy.locationHint}
        error={errors.location?.message}
        registration={register("location")}
      />
    </fieldset>
  );
}

/** Experience, notice period and pay expectations. */
export function ExperienceFields({ register, errors }: Readonly<SectionProps>) {
  return (
    <fieldset className="job-apply__group">
      <legend className="stage-label">{copy.professional}</legend>
      <div className={ROW_CLASS}>
        <SelectField
          id="experience"
          label={copy.experience}
          marker="required"
          placeholder={copy.select}
          options={copy.experienceOptions}
          error={errors.experience?.message}
          registration={register("experience")}
        />
        <SelectField
          id="noticePeriod"
          label={copy.noticePeriod}
          marker="required"
          placeholder={copy.select}
          options={copy.noticeOptions}
          error={errors.noticePeriod?.message}
          registration={register("noticePeriod")}
        />
      </div>
      <div className={ROW_CLASS}>
        <TextField
          id="currentCTC"
          label={copy.currentCTC}
          marker="optional"
          inputMode="decimal"
          error={errors.currentCTC?.message}
          registration={register("currentCTC")}
        />
        <TextField
          id="expectedCTC"
          label={copy.expectedCTC}
          marker="required"
          inputMode="decimal"
          error={errors.expectedCTC?.message}
          registration={register("expectedCTC")}
        />
      </div>
    </fieldset>
  );
}

/** LinkedIn and portfolio links (the résumé sits above them, in the same group). */
export function LinkFields({ register, errors }: Readonly<SectionProps>) {
  return (
    <div className={ROW_CLASS}>
      <TextField
        id="linkedin"
        type="url"
        label={copy.linkedin}
        marker="optional"
        placeholder="https://"
        error={errors.linkedin?.message}
        registration={register("linkedin")}
      />
      <TextField
        id="portfolio"
        type="url"
        label={copy.portfolio}
        marker="optional"
        placeholder="https://"
        error={errors.portfolio?.message}
        registration={register("portfolio")}
      />
    </div>
  );
}

/** Why this company, how they heard of the role, and consent. */
export function AboutFields({
  register,
  errors,
  companyName,
}: Readonly<SectionProps & { companyName: string }>) {
  return (
    <fieldset className="job-apply__group">
      <legend className="stage-label">{copy.extra}</legend>
      <FormField
        id="coverLetter"
        label={fill(copy.coverLetter, { company: companyName })}
        marker="required"
        error={errors.coverLetter?.message}
      >
        <textarea
          id="coverLetter"
          rows={5}
          aria-invalid={Boolean(errors.coverLetter)}
          className={CONTROL_CLASS}
          {...register("coverLetter")}
        />
      </FormField>
      <SelectField
        id="referral"
        label={copy.referral}
        marker="optional"
        placeholder={copy.select}
        options={copy.referralOptions}
        error={errors.referral?.message}
        registration={register("referral")}
      />
      <div className="job-apply__consent">
        <input
          id="consent"
          type="checkbox"
          aria-invalid={Boolean(errors.consent)}
          aria-describedby={errors.consent ? "consent-error" : undefined}
          {...register("consent")}
        />
        <label htmlFor="consent">{copy.consent}</label>
      </div>
      {errors.consent && (
        <p id="consent-error" role="alert" className="text-red-fg text-xs">
          {errors.consent.message}
        </p>
      )}
    </fieldset>
  );
}
