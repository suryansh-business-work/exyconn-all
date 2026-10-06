import { loadPolicies, loadPolicy, type PolicyListResult } from "../../legal";
import { breadcrumbJsonLd } from "../../inner/structured-data";
import type { PublicPolicy } from "../../portal/types";
import { crumbsLoader, itemCrumbs } from "./crumbs";
import type { PageLoader } from "./types";

/** cms.detail of 'policy.list': the policies, or the failure to read them. */
export type PolicyListDetail = PolicyListResult;

/** cms.detail of 'policy.detail': the policy, or null when the library could not be reached. */
export interface PolicyDetail {
  policy: PublicPolicy | null;
  title: string;
}

const text = (value: unknown): string => (typeof value === "string" ? value : "");

/** The published policies; the page still renders when Legal's library fails, as a 503. */
export const policyListLoader: PageLoader = async (input) => {
  const [result, crumbs] = await Promise.all([loadPolicies(), crumbsLoader(input)]);
  return {
    ...crumbs,
    item: result satisfies PolicyListDetail,
    status: result.status === "error" ? 503 : undefined,
  };
};

/** A policy by slug: unknown is a 404; a failed read renders a notice as a 503, never indexed. */
export const policyLoader: PageLoader = async ({ params, siteUrl, props }) => {
  const result = await loadPolicy(params.slug);
  if (result.status === "missing") {
    return null;
  }
  const policy = result.status === "found" ? result.policy : null;
  const title = policy?.title ?? text(props.fallbackTitle);
  const detail: PolicyDetail = { policy, title };
  return {
    item: detail,
    status: policy ? undefined : 503,
    noindex: !policy,
    vars: {
      title,
      titleLower: title.toLowerCase(),
      summary: policy?.summary ?? text(props.fallbackSummary),
    },
    jsonLd: [breadcrumbJsonLd(itemCrumbs(props, title), siteUrl)],
  };
};
