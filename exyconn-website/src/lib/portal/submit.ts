import { portalRequest } from "./client";

const CREATE_SUBMISSION = `
  mutation CreateWebsiteSubmission($input: WebsiteSubmissionInput!, $captcha: WebsiteCaptchaAnswer!) {
    createWebsiteSubmission(input: $input, captcha: $captcha) {
      id
    }
  }
`;

const CAPTCHA = `
  query WebsiteCaptcha {
    websiteCaptcha {
      token
      question
    }
  }
`;

/** A security question for a form, and the token the portal checks the answer against. */
export interface Captcha {
  token: string;
  question: string;
}

/** The answer a visitor gave to one question. */
export interface CaptchaAnswer {
  token: string;
  answer: string;
}

/** A fresh question from the portal. Each is good for one answer, for ten minutes. */
export async function getCaptcha(): Promise<Captcha> {
  const result = await portalRequest<{ websiteCaptcha: Captcha }>(CAPTCHA);
  return result.websiteCaptcha;
}

/**
 * Persists a website form submission to the portal, where it lands in the
 * Website > Form Submissions inbox. The portal refuses it unless the captcha is answered.
 */
export async function submitForm(
  formType: string,
  data: Record<string, string>,
  captcha: CaptchaAnswer
): Promise<string | undefined> {
  const result = await portalRequest<{ createWebsiteSubmission: { id: string } }>(
    CREATE_SUBMISSION,
    { input: { formType, source: "website", submissionData: data }, captcha }
  );

  return result.createWebsiteSubmission?.id;
}
