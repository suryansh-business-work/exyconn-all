/**
 * A company's careers page, shaped from its portal record: the facts under its name and its
 * social links — only the ones it has (an empty or unsafe link is left out, never guessed).
 */
import type { JobCompany } from "../portal/types";
import { safeHref } from "../safe-output";
import { fill } from "./format";

export interface SocialLink {
  network: string;
  href: string;
}

const NETWORKS = [
  ["linkedin", "LinkedIn"],
  ["twitter", "X"],
  ["instagram", "Instagram"],
  ["facebook", "Facebook"],
] as const;

/** The company's social profiles that are set and safe to link. */
export const socialLinks = (company: Pick<JobCompany, "socialLinks">): SocialLink[] =>
  NETWORKS.flatMap(([key, network]) => {
    const href = safeHref(company.socialLinks?.[key]);
    return href ? [{ network, href }] : [];
  });

/** Industry, headquarters, size and founding year — whichever the record has. */
export const companyFacts = (
  company: Pick<JobCompany, "industry" | "headquarters" | "employees" | "founded">,
  labels: { employees: string; founded: string }
): string[] =>
  [
    company.industry,
    company.headquarters,
    company.employees ? fill(labels.employees, { n: company.employees }) : "",
    company.founded ? fill(labels.founded, { year: company.founded }) : "",
  ].filter((fact) => fact.trim() !== "");

/** True when a rich-text field holds any text (the editor saves "<p></p>" for empty). */
export const hasText = (html: string): boolean => html.replaceAll(/<[^>]*>/g, "").trim() !== "";
