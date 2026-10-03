/**
 * JobPosting JSON-LD for a role's page. Every field comes from the posting or its company —
 * the country included, read from the posting's own location ("Pune, India" → India), never
 * assumed.
 */
import type { Job, JobCompany } from "../portal/types";

/** schema.org employmentType for each portal job type. */
const EMPLOYMENT_TYPES: Readonly<Record<string, string>> = {
  "Full Time": "FULL_TIME",
  "Part Time": "PART_TIME",
  Contract: "CONTRACTOR",
  Freelance: "CONTRACTOR",
  Internship: "INTERN",
};

/** Location words that name a way of working, not a place. */
const NOT_A_PLACE = new Set(["remote", "anywhere", "worldwide", "hybrid", "on-site", "onsite"]);

export interface PlaceParts {
  locality?: string;
  region?: string;
  country?: string;
}

/**
 * "Pune, Maharashtra, India" → locality Pune, region Maharashtra, country India. A single
 * part is a locality; "Remote" (or similar) is no place at all. "Remote, India" keeps India.
 */
export const placeParts = (location: string): PlaceParts => {
  const parts = location
    .split(/[,;|]/)
    .map((part) => part.trim())
    .filter((part) => part !== "" && !NOT_A_PLACE.has(part.toLowerCase()));
  if (parts.length === 0) {
    return {};
  }
  if (parts.length === 1) {
    return location.includes(",") ? { country: parts[0] } : { locality: parts[0] };
  }
  const country = parts.at(-1);
  const region = parts.length > 2 ? parts.at(-2) : undefined;
  return { locality: parts[0], ...(region ? { region } : {}), country };
};

export interface JobPostingInput {
  job: Job;
  company: JobCompany;
  /** The posting's body as sanitized HTML (Google asks for the full description). */
  description: string;
  /** Absolute, market-correct URL of the role's page. */
  url: string;
  /** Absolute logo URL, or "" when the company has none. */
  logo: string;
}

const address = ({ locality, region, country }: PlaceParts) => ({
  "@type": "PostalAddress",
  ...(locality ? { addressLocality: locality } : {}),
  ...(region ? { addressRegion: region } : {}),
  ...(country ? { addressCountry: country } : {}),
});

/** Where the job is done: a remote role states the country it hires in, an office role its place. */
const locationLd = (job: Job) => {
  const place = placeParts(job.location);
  if (job.workMode === "Remote") {
    return {
      jobLocationType: "TELECOMMUTE",
      ...(place.country
        ? { applicantLocationRequirements: { "@type": "Country", name: place.country } }
        : {}),
    };
  }
  return place.locality || place.country
    ? { jobLocation: { "@type": "Place", address: address(place) } }
    : {};
};

export const jobPostingJsonLd = ({ job, company, description, url, logo }: JobPostingInput) => {
  const employmentType = EMPLOYMENT_TYPES[job.jobType];
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: description || job.shortJobDescription,
    datePosted: job.jobPostDate,
    ...(job.applicationDeadline ? { validThrough: job.applicationDeadline } : {}),
    ...(employmentType ? { employmentType } : {}),
    identifier: { "@type": "PropertyValue", name: company.name, value: job.jobCode },
    hiringOrganization: {
      "@type": "Organization",
      name: company.name,
      ...(company.website ? { sameAs: company.website } : {}),
      ...(logo ? { logo } : {}),
    },
    ...locationLd(job),
    ...(job.skillSet.length > 0 ? { skills: job.skillSet.join(", ") } : {}),
    ...(job.category ? { occupationalCategory: job.category } : {}),
    directApply: true,
    url,
  };
};
