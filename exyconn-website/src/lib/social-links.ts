import { BRANDING_FALLBACK, type Branding } from "./portal";
import { safeHref } from "./safe-output";

export type SocialNetwork =
  | "linkedin"
  | "twitter"
  | "clutch"
  | "crunchbase"
  | "ambitionbox"
  | "facebook"
  | "instagram"
  | "youtube"
  | "github";

/**
 * How a network's icon is drawn: a Font Awesome glyph where Font Awesome has one, otherwise
 * the brand's own logo as a single-colour mark (see `brand-mark` in global.css). Either way it
 * is painted in the text colour, so every icon in a row reads as one set.
 */
export type SocialGlyph = { kind: "font"; className: string } | { kind: "mark"; className: string };

export interface SocialLink {
  id: SocialNetwork;
  url: string;
  glyph: SocialGlyph;
  /** The accessible name: the link is only an icon, so this is all a screen reader hears. */
  label: string;
}

const font = (className: string): SocialGlyph => ({ kind: "font", className });
const mark = (className: string): SocialGlyph => ({ kind: "mark", className });

/**
 * The company's profiles, from Admin > Branding, for every place that links to them — in the
 * order they are shown: the social networks people follow first, then the review and company
 * directories that vouch for the business.
 *
 * An empty URL means "no account", so that network is left out. LinkedIn, X, Clutch,
 * Crunchbase, AmbitionBox and GitHub fall back to the company's known profiles until an admin
 * sets them; the others have none.
 */
export function socialLinks(branding: Branding): SocialLink[] {
  const links: SocialLink[] = [
    {
      id: "linkedin",
      url: branding.linkedinUrl || BRANDING_FALLBACK.linkedinUrl,
      glyph: font("fa-brands fa-linkedin-in"),
      label: "Follow us on LinkedIn (opens in new tab)",
    },
    {
      id: "twitter",
      url: branding.twitterUrl || BRANDING_FALLBACK.twitterUrl,
      glyph: font("fa-brands fa-x-twitter"),
      label: "Follow us on X (opens in new tab)",
    },
    {
      id: "clutch",
      url: branding.clutchUrl || BRANDING_FALLBACK.clutchUrl,
      glyph: mark("brand-mark-clutch"),
      label: "Read our reviews on Clutch (opens in new tab)",
    },
    {
      id: "crunchbase",
      url: branding.crunchbaseUrl || BRANDING_FALLBACK.crunchbaseUrl,
      glyph: mark("brand-mark-crunchbase"),
      label: "See our company profile on Crunchbase (opens in new tab)",
    },
    {
      id: "ambitionbox",
      url: branding.ambitionboxUrl || BRANDING_FALLBACK.ambitionboxUrl,
      glyph: mark("brand-mark-ambitionbox"),
      label: "Read employee reviews on AmbitionBox (opens in new tab)",
    },
    {
      id: "facebook",
      url: branding.facebookUrl,
      glyph: font("fa-brands fa-facebook-f"),
      label: "Follow us on Facebook (opens in new tab)",
    },
    {
      id: "instagram",
      url: branding.instagramUrl,
      glyph: font("fa-brands fa-instagram"),
      label: "Follow us on Instagram (opens in new tab)",
    },
    {
      id: "youtube",
      url: branding.youtubeUrl,
      glyph: font("fa-brands fa-youtube"),
      label: "Subscribe to us on YouTube (opens in new tab)",
    },
    {
      id: "github",
      url: branding.githubUrl || BRANDING_FALLBACK.githubUrl,
      glyph: font("fa-brands fa-github"),
      label: "View our GitHub profile (opens in new tab)",
    },
  ];
  return links
    .map((link) => ({ ...link, url: safeHref(link.url) }))
    .filter((link) => link.url !== "");
}
