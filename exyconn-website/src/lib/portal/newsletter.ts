import { portalRequest } from "./client";
import type { CaptchaAnswer } from "./submit";

/** A published newsletter issue as the list shows it (Website › Newsletter › Issues). */
export interface NewsletterIssueSummary {
  id: string;
  slug: string;
  title: string;
  summary: string;
  coverImage: string;
  publishedAt: string;
}

/** One issue with its body: rich HTML, the same contract as a blog post's. */
export interface NewsletterIssue extends NewsletterIssueSummary {
  content: string;
  contentCss: string;
}

const LIST_FIELDS = "id slug title summary coverImage publishedAt";
const ISSUE_FIELDS = `${LIST_FIELDS} content contentCss`;

/**
 * A site's published issues, newest first. A portal failure is logged and renders the list's
 * empty state, like every other collection (see queries.ts).
 */
export async function getNewsletterIssues(site: string): Promise<NewsletterIssueSummary[]> {
  try {
    const data = await portalRequest<{ publicNewsletterIssues: NewsletterIssueSummary[] }>(
      `query NewsletterIssues($site: String) { publicNewsletterIssues(site: $site) { ${LIST_FIELDS} } }`,
      { site }
    );
    return data.publicNewsletterIssues;
  } catch (error) {
    console.error("Portal getNewsletterIssues failed — rendering without it.", error);
    return [];
  }
}

/** One issue by slug, or null when the site has not published one there (or the portal failed). */
export async function getNewsletterIssue(
  slug: string,
  site: string
): Promise<NewsletterIssue | null> {
  try {
    const data = await portalRequest<{ publicNewsletterIssue: NewsletterIssue | null }>(
      `query NewsletterIssue($slug: String!, $site: String) { publicNewsletterIssue(slug: $slug, site: $site) { ${ISSUE_FIELDS} } }`,
      { slug, site }
    );
    return data.publicNewsletterIssue;
  } catch (error) {
    console.error("Portal getNewsletterIssue failed — rendering without it.", error);
    return null;
  }
}

export interface NewsletterSignup {
  /** The site's key. */
  site: string;
  email: string;
  name: string;
  /** The page they signed up on. */
  source: string;
}

const SUBSCRIBE = `
  mutation SubscribeNewsletter($input: NewsletterSignupInput!, $captcha: WebsiteCaptchaAnswer!) {
    subscribeNewsletter(input: $input, captcha: $captcha)
  }
`;

/** Signs somebody up to a site's newsletter. The portal refuses it unless the captcha is answered. */
export async function subscribeNewsletter(
  input: NewsletterSignup,
  captcha: CaptchaAnswer
): Promise<void> {
  await portalRequest<{ subscribeNewsletter: boolean }>(SUBSCRIBE, { input, captcha });
}
