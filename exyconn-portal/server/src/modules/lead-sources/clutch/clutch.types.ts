/**
 * One Clutch.co company as CRM > Lead generators > Clutch shows and files it, whichever engine
 * found it: Clutch's own MCP server (bot.clutch.co, free) or an Apify Clutch scraper. Every field
 * is a plain value so a run can be stored as found and shown again without another call.
 */
export interface ClutchReview {
  title: string;
  rating: number | null;
  comment: string;
  reviewer: string;
  reviewerTitle: string;
  industry: string;
  projectSize: string;
  date: string;
}

export interface ClutchPortfolioItem {
  title: string;
  description: string;
  imageUrl: string;
}

/** A person found at the company, with a way to reach them (rarely present on Clutch). */
export interface ClutchPerson {
  name: string;
  title: string;
  email: string;
  phone: string;
}

export interface ClutchCompany {
  /** Clutch's own id, or the profile URL when the engine gives no id. */
  key: string;
  name: string;
  profileUrl: string;
  website: string;
  logoUrl: string;
  tagline: string;
  description: string;
  rating: number | null;
  reviewCount: number | null;
  verification: string;
  hourlyRate: string;
  minProjectSize: string;
  employees: string;
  founded: string;
  headquarters: string;
  locations: string[];
  phone: string;
  emails: string[];
  services: string[];
  people: ClutchPerson[];
  reviews: ClutchReview[];
  portfolio: ClutchPortfolioItem[];
}

export type Raw = Record<string, unknown>;

export const text = (value: unknown): string => {
  if (typeof value === 'string') {
    return value.trim();
  }
  return typeof value === 'number' ? String(value) : '';
};
export const num = (value: unknown): number | null => {
  const parsed = typeof value === 'string' ? Number.parseFloat(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : null;
};
export const list = (value: unknown): Raw[] =>
  Array.isArray(value) ? value.filter((v): v is Raw => typeof v === 'object' && v !== null) : [];
export const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.map(text).filter(Boolean) : [];
export const obj = (value: unknown): Raw =>
  typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Raw) : {};

/** A company with every list empty: what each engine fills in. */
export const blankCompany = (key: string, name: string): ClutchCompany => ({
  key,
  name,
  profileUrl: '',
  website: '',
  logoUrl: '',
  tagline: '',
  description: '',
  rating: null,
  reviewCount: null,
  verification: '',
  hourlyRate: '',
  minProjectSize: '',
  employees: '',
  founded: '',
  headquarters: '',
  locations: [],
  phone: '',
  emails: [],
  services: [],
  people: [],
  reviews: [],
  portfolio: [],
});
