import { getPublicPolicies, getPublicPolicy } from "../portal/queries";
import type { PublicPolicy } from "../portal/types";
import { fill } from "../career/format";
import { readerDate } from "./dates";

export type PolicyListResult =
  Readonly<{ status: "ok"; policies: PublicPolicy[] }> | Readonly<{ status: "error" }>;

export type PolicyResult =
  | Readonly<{ status: "found"; policy: PublicPolicy }>
  | Readonly<{ status: "missing" }>
  | Readonly<{ status: "error" }>;

/**
 * The operator company's public policies. A portal failure is logged and reported as
 * `error`, so the page renders its own notice instead of a server error.
 */
export async function loadPolicies(fetch = getPublicPolicies): Promise<PolicyListResult> {
  try {
    return { status: "ok", policies: await fetch() };
  } catch (error) {
    console.error("Public policies could not be loaded from the portal.", error);
    return { status: "error" };
  }
}

/** One public policy: found, missing (a real 404), or unavailable because the portal failed. */
export async function loadPolicy(
  slug: string | undefined,
  fetch = getPublicPolicy
): Promise<PolicyResult> {
  if (!slug) {
    return { status: "missing" };
  }
  try {
    const policy = await fetch(slug);
    return policy ? { status: "found", policy } : { status: "missing" };
  } catch (error) {
    console.error(`Public policy "${slug}" could not be loaded from the portal.`, error);
    return { status: "error" };
  }
}

/** One row of the policies index, with its dates in the reader's locale. */
export interface PolicyRow {
  href: string;
  title: string;
  summary: string;
  meta: string;
  updatedIso: string;
}

/**
 * One row of the policies index. `metaTemplate` is the page's copy, e.g.
 * "Version {version} · Effective {effective} · Updated {updated}".
 */
export function policyRow(policy: PublicPolicy, locale: string, metaTemplate: string): PolicyRow {
  const effective = readerDate(policy.effectiveDate, locale);
  const updated = readerDate(policy.updatedAt, locale);
  return {
    href: `/policies/${policy.slug}`,
    title: policy.title,
    summary: policy.summary,
    meta: fill(metaTemplate, {
      version: policy.version,
      effective: effective.text,
      updated: updated.text,
    }),
    updatedIso: updated.iso,
  };
}

/**
 * The plain-words points above a policy: its own summary, then its version and start date
 * (`versionTemplate`, e.g. "Version {version}, in effect from {effective}.").
 */
export function policySummary(
  policy: PublicPolicy,
  locale: string,
  versionTemplate: string
): string[] {
  const effective = readerDate(policy.effectiveDate, locale).text;
  const version = fill(versionTemplate, { version: policy.version, effective });
  return policy.summary ? [policy.summary, version] : [version];
}

/** How many sheets the policies scene stacks: one per published policy, within the shape's 1–8. */
export function policySheets(count: number): number | undefined {
  return count > 0 ? Math.min(count, 8) : undefined;
}
