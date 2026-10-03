/**
 * Sends a job application — its fields and the résumé file — to the portal in one call.
 *
 * The other website forms go through `submitForm` (lib/portal/submit.ts), which carries text
 * only. An application also carries the résumé, so it uses the mutation's `resume` argument:
 * the portal checks the file (PDF/DOC/DOCX, 5 MB), hosts it and stores its address as
 * `resumeUrl` on the submission and the HR applicant.
 */
import { portalRequest } from "../portal/client";
import type { CaptchaAnswer } from "../portal/submit";
import { JOB_APPLICATION_FORM_TYPE, type ResumeUpload } from "./application";

const APPLY = `
  mutation ApplyForJob(
    $input: WebsiteSubmissionInput!
    $captcha: WebsiteCaptchaAnswer!
    $resume: WebsiteFileInput
  ) {
    createWebsiteSubmission(input: $input, captcha: $captcha, resume: $resume) {
      id
    }
  }
`;

/** Files the application; resolves the submission id. Throws PortalRequestError on refusal. */
export async function submitJobApplication(
  fields: Record<string, string>,
  resume: ResumeUpload,
  captcha: CaptchaAnswer
): Promise<string | undefined> {
  const result = await portalRequest<{ createWebsiteSubmission: { id: string } }>(APPLY, {
    input: { formType: JOB_APPLICATION_FORM_TYPE, source: "website", submissionData: fields },
    captcha,
    resume,
  });
  return result.createWebsiteSubmission?.id;
}
