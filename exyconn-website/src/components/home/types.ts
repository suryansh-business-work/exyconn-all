/**
 * The shapes of the home chapters' props. Every word on the home page arrives as props from
 * the CMS (Website › Pages › Home); the catalogue's defaults are in @exyconn/cms
 * (catalogue/home.copy*.ts).
 */
export interface HomeAction {
  label: string;
  href: string;
  icon: string;
  external?: boolean;
}

/** An icon + title + text row (GlassList). */
export interface HomeItem {
  icon: string;
  title: string;
  text: string;
}

export interface HomeStat {
  value: string;
  label: string;
}

export interface HomeLogo {
  name: string;
  src: string;
}

/** A chapter's or panel's heading: kicker, two-line title and lead. */
export interface HomeHeading {
  badge: string;
  title: string;
  accent: string;
  lead: string;
}

/** The AI service catalogue's panel: a heading with one link. */
export interface CatalogueHeading extends HomeHeading {
  ctaLabel: string;
  ctaHref: string;
}
