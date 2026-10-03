/** The legal pages, so each can point to the others ("Related policies"). */
export interface LegalLink {
  key: "privacy" | "cookies" | "legal" | "grievance" | "policies" | "contact";
  label: string;
  text: string;
  href: string;
}

export const LEGAL_LINKS: readonly LegalLink[] = [
  {
    key: "privacy",
    label: "Privacy policy",
    text: "How we collect, use, and protect your personal information.",
    href: "/privacy-policy",
  },
  {
    key: "cookies",
    label: "Cookie policy",
    text: "Understanding how we use cookies to improve your experience.",
    href: "/cookies",
  },
  {
    key: "policies",
    label: "Company policies",
    text: "The commitments we publish, and when each one took effect.",
    href: "/policies",
  },
  {
    key: "legal",
    label: "Legal requests",
    text: "Copyright, takedown, trademark and privacy requests.",
    href: "/legal",
  },
  {
    key: "grievance",
    label: "Raise a grievance",
    text: "Share a concern with our compliance team, confidentially.",
    href: "/grievance",
  },
  {
    key: "contact",
    label: "Contact us",
    text: "Anything else — reach the team directly.",
    href: "/contact",
  },
];

/** Every legal link except the page the reader is on. */
export function relatedLegalLinks(current: LegalLink["key"]): LegalLink[] {
  return LEGAL_LINKS.filter((link) => link.key !== current);
}
