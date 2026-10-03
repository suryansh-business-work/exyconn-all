/**
 * Freelance gigs shaped for the careers pages: pay, the apply link, status, related gigs and
 * the filter data. Pure functions over portal rows.
 */
import { filterTokens, sortableDate } from "../content/format";
import { groupByGigCategory } from "../gigCategoryColors";
import { slugify } from "../inner/headings";
import type { Gig } from "../portal/types";
import { safeHref } from "../safe-output";
import { fill } from "./format";

/** Only an open gig takes applications; in-progress, completed and cancelled ones do not. */
export const isOpenGig = (gig: Pick<Gig, "status">): boolean => gig.status === "open";

/** The budget as the portal has it, or undefined — a gig without one shows no pay at all. */
export const gigPay = (gig: Pick<Gig, "budget">): string | undefined =>
  gig.budget.trim() || undefined;

/** The gig's page. */
export const gigHref = (gig: Pick<Gig, "gigCode">): string => `/career/gig/${gig.gigCode}`;

export type GigApplyKind = "email" | "whatsapp" | "form";

export interface GigApply {
  kind: GigApplyKind;
  href: string;
  external: boolean;
}

const phoneDigits = (contact: string): string => contact.replaceAll(/\D/g, "");

/**
 * Where "apply" goes, by the gig's application type: an email with the subject filled in, a
 * WhatsApp chat with the same text, or the posted form's address. Null when the contact is
 * missing or unsafe — the page then offers no apply link rather than a broken one.
 */
export const gigApplyLink = (gig: Gig, subjectTemplate: string): GigApply | null => {
  const contact = gig.applicationContact.trim();
  const subject = fill(subjectTemplate, { title: gig.title, code: gig.gigCode });
  if (gig.applicationType === "whatsapp") {
    const digits = phoneDigits(contact);
    return digits
      ? {
          kind: "whatsapp",
          href: `https://wa.me/${digits}?text=${encodeURIComponent(subject)}`,
          external: true,
        }
      : null;
  }
  if (gig.applicationType === "form") {
    const href = safeHref(contact);
    return href ? { kind: "form", href, external: /^https?:/i.test(href) } : null;
  }
  return contact.includes("@")
    ? {
        kind: "email",
        href: `mailto:${contact}?subject=${encodeURIComponent(subject)}`,
        external: false,
      }
    : null;
};

/** Up to `count` other open gigs, same category first, then the newest. */
export const relatedGigs = (gig: Gig, openGigs: readonly Gig[], count = 3): Gig[] =>
  openGigs
    .filter((other) => other.gigCode !== gig.gigCode)
    .toSorted(
      (a, b) =>
        Number(b.category === gig.category) - Number(a.category === gig.category) ||
        sortableDate(b.postedDate) - sortableDate(a.postedDate)
    )
    .slice(0, count);

/** Open gigs in category order (see gigCategoryColors), urgent then newest within each. */
export const orderedGigs = (gigs: readonly Gig[]): Gig[] =>
  groupByGigCategory(gigs).flatMap(({ items }) =>
    items.toSorted(
      (a, b) =>
        Number(b.isUrgent) - Number(a.isUrgent) ||
        sortableDate(b.postedDate) - sortableDate(a.postedDate)
    )
  );

/** A chip per category present, in category order, so every listed gig can be filtered to. */
export const gigCategoryOptions = (gigs: readonly Gig[]) =>
  groupByGigCategory(gigs).map(({ category }) => ({ value: slugify(category), label: category }));

/** A far-future sort key, so gigs without a deadline sort after those with one. */
const NO_DEADLINE = 99_999_999;

/** `data-*` attributes FilterBar reads from one gig card. */
export const gigFilterData = (gig: Gig) => ({
  "data-filter-item": true,
  "data-filter-category": filterTokens([gig.category]),
  "data-search": [gig.title, gig.category, gig.shortDescription, ...gig.tags].join(" "),
  "data-sort-posted": sortableDate(gig.postedDate),
  "data-sort-deadline": gig.deadline ? sortableDate(gig.deadline) : NO_DEADLINE,
});
