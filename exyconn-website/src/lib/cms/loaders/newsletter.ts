import { absoluteAsset, marketPageUrl } from "../../content/format";
import { articleJsonLd } from "../../content/structured-data";
import {
  BRANDING_FALLBACK,
  getNewsletterIssue,
  getNewsletterIssues,
  type NewsletterIssue,
  type NewsletterIssueSummary,
} from "../../portal";
import { itemCrumbs, itemCrumbsJsonLd } from "./crumbs";
import type { PageLoader } from "./types";

const EARLIER_ISSUES = 3;

/** cms.detail of 'newsletter.issue': the issue, a few earlier ones and its URL. */
export interface IssueDetail {
  issue: NewsletterIssue;
  earlier: NewsletterIssueSummary[];
  url: string;
}

export const issueLoader: PageLoader = async (input) => {
  const { params, site, market, siteUrl, props } = input;
  const [issue, issues] = params.slug
    ? await Promise.all([getNewsletterIssue(params.slug, site), getNewsletterIssues(site)])
    : [null, []];
  if (!issue) {
    return null;
  }
  const url = marketPageUrl(siteUrl, market, `/newsletter/${issue.slug}`);
  const detail: IssueDetail = {
    issue,
    earlier: issues.filter((other) => other.slug !== issue.slug).slice(0, EARLIER_ISSUES),
    url,
  };
  return {
    item: detail,
    ogType: "article",
    vars: { title: issue.title, summary: issue.summary, coverImage: issue.coverImage },
    jsonLd: [
      articleJsonLd({
        type: "Article",
        headline: issue.title,
        description: issue.summary,
        image: absoluteAsset(siteUrl, issue.coverImage),
        published: issue.publishedAt,
        url,
        keywords: [],
        publisher: {
          name: BRANDING_FALLBACK.businessName,
          url: siteUrl,
          logo: `${siteUrl}${BRANDING_FALLBACK.faviconUrl}`,
        },
      }),
      itemCrumbsJsonLd(itemCrumbs(props, issue.title), input, url),
    ],
  };
};
