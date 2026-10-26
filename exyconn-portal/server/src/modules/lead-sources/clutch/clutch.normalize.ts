import {
  blankCompany,
  list,
  num,
  obj,
  strings,
  text,
  type ClutchCompany,
  type ClutchPerson,
  type ClutchPortfolioItem,
  type ClutchReview,
  type Raw,
} from './clutch.types';

/** A line of the MCP's `details` text, e.g. "Hourly rate: $50 - $99" → "$50 - $99". */
function detail(details: string, label: string): string {
  const line = details.split('\n').find((row) => row.startsWith(`${label}:`));
  return line ? line.slice(label.length + 1).trim() : '';
}

/** A provider from Clutch's MCP server (search results and get_provider_info share the shape). */
export function fromMcpProvider(raw: Raw): ClutchCompany {
  const details = text(raw.details);
  return {
    ...blankCompany(text(raw.id) || text(raw.url), text(raw.title)),
    profileUrl: text(raw.url),
    logoUrl: text(raw.logo_url),
    description: text(raw.description),
    rating: num(raw.rating),
    reviewCount: num(raw.reviews_number),
    verification: text(raw.verification_level),
    hourlyRate: detail(details, 'Hourly rate'),
    minProjectSize: detail(details, 'Min. project size').split(';')[0] ?? '',
    headquarters: text(raw.headquarters),
    locations: strings(raw.office_locations),
    services: detail(details, 'Certified in')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  };
}

/** Review text arrives as HTML paragraphs; the page shows it as plain text. */
export const plainText = (html: string): string =>
  html
    .replaceAll(/<\/p>\s*<p>/g, '\n')
    .replaceAll(/<[^>]*>/g, '')
    .replaceAll('&amp;', '&')
    .replaceAll(/\s+\n/g, '\n')
    .trim();

/** A review from the MCP's get_service_provider_reviews (`reviews_sample`). */
export function fromMcpReview(raw: Raw): ClutchReview {
  return {
    title: text(raw.title),
    rating: num(raw.overall_rating),
    comment: plainText(text(raw.summary)),
    reviewer: '',
    reviewerTitle: '',
    industry: '',
    projectSize: text(raw.project_size),
    date: text(raw.created_at).slice(0, 10),
  };
}

function apifyReview(raw: Raw): ClutchReview {
  const review = obj(raw.review);
  const reviewer = obj(raw.reviewer);
  const project = obj(raw.project);
  return {
    title: text(project.name) || text(raw.name),
    rating: num(review.rating) ?? num(raw.rating),
    comment: text(review.comments) || text(raw.comment) || text(raw.text),
    reviewer: text(reviewer.name),
    reviewerTitle: text(reviewer.title),
    industry: text(reviewer.industry),
    projectSize: text(project.size),
    date: text(raw.datePublished) || text(raw.date),
  };
}

const portfolioItem = (raw: Raw): ClutchPortfolioItem => ({
  title: text(raw.title) || text(raw.name),
  description: text(raw.description),
  imageUrl: text(raw.image) || text(raw.imageUrl),
});

const person = (raw: Raw): ClutchPerson => ({
  name: text(raw.name),
  title: text(raw.title),
  email: text(raw.email).toLowerCase(),
  phone: text(raw.phone),
});

/** Where an Apify item keeps its profile: ScrapeAI's under `summary`, others at the top. */
function apifySummary(raw: Raw): Raw {
  return Object.keys(obj(raw.summary)).length ? { ...raw, ...obj(raw.summary) } : raw;
}

/** "Pune, Maharashtra, India" from an address object. */
const addressText = (raw: Raw) =>
  [text(raw.locality), text(raw.region), text(raw.country)].filter(Boolean).join(', ');

/**
 * An item from an Apify Clutch scraper. ScrapeAI's (`summary.*`, `serviceProvided`) and the
 * flat shape others use (`name`, `services`) both read here.
 */
export function fromApifyItem(raw: Raw): ClutchCompany {
  const s = apifySummary(raw);
  const addresses = list(s.addresses);
  const services = [...list(s.serviceProvided), ...list(s.services)]
    .map((row) => text(row.name) || text(row.title))
    .filter(Boolean);
  const emails = [...strings(s.emails), text(s.email)].map((e) => e.toLowerCase()).filter(Boolean);
  return {
    ...blankCompany(text(s.id) || text(s.url), text(s.name)),
    profileUrl: text(s.url),
    website: text(s.websiteUrl) || text(s.website),
    logoUrl: text(s.logo),
    tagline: text(s.title) || text(s.tagline),
    description: text(s.description),
    rating: num(s.rating),
    reviewCount: num(s.noOfReviews) ?? num(s.reviewCount),
    verification: text(s.verificationStatus),
    hourlyRate: text(s.averageHourlyRate) || text(s.avgHourlyRate),
    minProjectSize: text(s.minProjectSize),
    employees: text(s.employees),
    founded: text(s.founded),
    headquarters:
      text(obj(s.headquarters).title) || text(s.headquarters) || addressText(addresses[0] ?? {}),
    locations: addresses.map(addressText).filter(Boolean),
    phone: text(s.phone) || text(addresses.find((a) => text(a.phone))?.phone),
    emails: [...new Set(emails)],
    services,
    people: list(s.contacts)
      .map(person)
      .filter((p) => p.name),
    reviews: list(s.reviews).map(apifyReview),
    portfolio: list(s.portfolio).map(portfolioItem),
  };
}
