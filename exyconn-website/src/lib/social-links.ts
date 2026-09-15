import { BRANDING_FALLBACK, type Branding } from "./portal";
import { safeHref } from "./safe-output";

export type SocialNetwork =
  "linkedin" | "twitter" | "facebook" | "instagram" | "youtube" | "github";

export interface SocialLink {
  id: SocialNetwork;
  url: string;
  /** Font Awesome classes for the brand glyph. */
  icon: string;
  /** The accessible name: the link is only an icon, so this is all a screen reader hears. */
  label: string;
}

/**
 * The company's social accounts, from Admin > Branding, for every place that links to them.
 *
 * An empty URL means "no account", so that network is left out. LinkedIn, X and GitHub fall
 * back to the accounts the site linked before branding was portal-driven; the others never
 * had one.
 */
export function socialLinks(branding: Branding): SocialLink[] {
  const links: SocialLink[] = [
    {
      id: "linkedin",
      url: branding.linkedinUrl || BRANDING_FALLBACK.linkedinUrl,
      icon: "fa-brands fa-linkedin-in",
      label: "Follow us on LinkedIn (opens in new tab)",
    },
    {
      id: "twitter",
      url: branding.twitterUrl || BRANDING_FALLBACK.twitterUrl,
      icon: "fa-brands fa-x-twitter",
      label: "Follow us on X / Twitter (opens in new tab)",
    },
    {
      id: "facebook",
      url: branding.facebookUrl,
      icon: "fa-brands fa-facebook-f",
      label: "Follow us on Facebook (opens in new tab)",
    },
    {
      id: "instagram",
      url: branding.instagramUrl,
      icon: "fa-brands fa-instagram",
      label: "Follow us on Instagram (opens in new tab)",
    },
    {
      id: "youtube",
      url: branding.youtubeUrl,
      icon: "fa-brands fa-youtube",
      label: "Subscribe to us on YouTube (opens in new tab)",
    },
    {
      id: "github",
      url: branding.githubUrl || BRANDING_FALLBACK.githubUrl,
      icon: "fa-brands fa-github",
      label: "View our GitHub profile (opens in new tab)",
    },
  ];
  return links
    .map((link) => ({ ...link, url: safeHref(link.url) }))
    .filter((link) => link.url !== "");
}
