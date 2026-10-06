/**
 * The job application form's words (components/career/job-application, a React Hook Form +
 * Zod island). Every other word of the careers pages is the CMS's (components career.*); this
 * stays in code because the form's choices are also its schema's allowed values
 * (job-application.schema.ts), and its copy is part of the island's bundle rather than of the
 * page.
 */

/** The application form's labels, choices and messages. */
export const APPLY_COPY = {
  formLabel: "Job application",
  personal: "About you",
  professional: "Your experience",
  links: "Résumé and links",
  extra: "Anything else",
  firstName: "First name",
  lastName: "Last name",
  email: "Email address",
  phone: "Phone number",
  location: "Current location",
  locationHint: "City, state or country",
  experience: "Years of experience",
  noticePeriod: "Notice period",
  currentCTC: "Current CTC (LPA)",
  expectedCTC: "Expected CTC (LPA)",
  linkedin: "LinkedIn profile",
  portfolio: "Portfolio / GitHub",
  resume: "Résumé / CV",
  resumeHint: "PDF, DOC or DOCX, up to 5 MB",
  resumeNone: "No file chosen",
  resumeChoose: "Choose a file",
  resumeChange: "Change file",
  coverLetter: "Why do you want to join {company}?",
  referral: "How did you hear about this position?",
  select: "Select",
  consent:
    "I agree to the processing of my personal data for recruitment purposes. My information is kept confidential and used only to evaluate my application.",
  submit: "Submit application",
  busy: "Sending…",
  successTitle: "Application sent",
  successText:
    "Thank you for applying to {title} at {company}. We will get back to you within 48 hours.",
  successAction: "More roles at {company}",
  failed: "Your application could not be sent. Please check your connection and try again.",
  resumeRefused: "That file could not be accepted. Please attach a PDF, DOC or DOCX of up to 5 MB.",
  experienceOptions: [
    { value: "0-1", label: "0–1 years" },
    { value: "1-2", label: "1–2 years" },
    { value: "2-4", label: "2–4 years" },
    { value: "4-6", label: "4–6 years" },
    { value: "6-10", label: "6–10 years" },
    { value: "10+", label: "10+ years" },
  ],
  noticeOptions: [
    { value: "immediate", label: "Immediate" },
    { value: "15days", label: "15 days" },
    { value: "30days", label: "30 days" },
    { value: "60days", label: "60 days" },
    { value: "90days", label: "90 days" },
  ],
  referralOptions: [
    { value: "linkedin", label: "LinkedIn" },
    { value: "careers-page", label: "Company careers page" },
    { value: "indeed", label: "Indeed" },
    { value: "naukri", label: "Naukri" },
    { value: "referral", label: "Employee referral" },
    { value: "social-media", label: "Social media" },
    { value: "other", label: "Other" },
  ],
} as const;
