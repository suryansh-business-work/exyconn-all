/** Careers text helpers, company facts and the JobPosting structured data. */
import { describe, expect, it } from "vitest";
import { companyFacts, hasText, socialLinks } from "../../src/lib/career/company";
import { cmsComponent } from "@exyconn/cms";
import {
  chapterNumbers,
  countLabel,
  fill,
  liveStats,
  sceneCount,
} from "../../src/lib/career/format";
import { jobPostingJsonLd, placeParts } from "../../src/lib/career/structured-data";
import { FIXTURE_COMPANIES, FIXTURE_JOBS } from "../fixtures/careers";

// The company page's wording is the CMS's (catalogue defaults = what exyconn.com is seeded with).
const COMPANY_COPY = cmsComponent("career.company")?.defaultProps as {
  employees: string;
  founded: string;
};

describe("format", () => {
  it("fills placeholders and leaves unknown ones", () => {
    expect(fill("{n} of {total} — {x}", { n: 2, total: 5 })).toBe("2 of 5 — {x}");
  });

  it("phrases one and many", () => {
    expect(countLabel(1, "One gig", "{n} gigs")).toBe("One gig");
    expect(countLabel(4, "One gig", "{n} gigs")).toBe("4 gigs");
  });

  it("clamps a live count for a scene, and leaves 0 to the shape's default", () => {
    expect(sceneCount(0, 1, 40)).toBeUndefined();
    expect(sceneCount(80, 1, 40)).toBe(40);
    expect(sceneCount(1, 3, 12)).toBe(3);
  });

  it("drops zero stats instead of showing them", () => {
    expect(
      liveStats([
        { count: 3, label: "Roles" },
        { count: 0, label: "Gigs" },
      ])
    ).toEqual([{ value: "3", label: "Roles" }]);
  });

  it("numbers only the chapters a page shows", () => {
    expect(chapterNumbers(["about", "culture", "roles"], { culture: false })).toEqual({
      about: 1,
      roles: 2,
    });
  });
});

describe("company", () => {
  const [company] = FIXTURE_COMPANIES;

  it("links only the social profiles a company has", () => {
    expect(socialLinks(company)).toEqual([
      { network: "LinkedIn", href: "https://linkedin.com/company/exyconn" },
    ]);
    expect(socialLinks(FIXTURE_COMPANIES[2])).toEqual([]);
    expect(
      socialLinks({ socialLinks: { ...company.socialLinks, twitter: "javascript:x" } })
    ).toHaveLength(1);
  });

  it("lists the facts the record has", () => {
    expect(companyFacts(company, COMPANY_COPY)).toEqual([
      "AI and software services",
      "Pune, India",
      "25-50 employees",
      "Founded 2022",
    ]);
    expect(
      companyFacts({ industry: "", headquarters: "", employees: "", founded: "" }, COMPANY_COPY)
    ).toEqual([]);
  });

  it("knows an empty rich-text field", () => {
    expect(hasText("<p></p>")).toBe(false);
    expect(hasText("<p>Hi</p>")).toBe(true);
  });
});

describe("JobPosting JSON-LD", () => {
  const [job] = FIXTURE_JOBS;
  const [company] = FIXTURE_COMPANIES;
  const base = {
    company,
    description: "<p>Full</p>",
    url: "https://exyconn.com/en-in/x",
    logo: "",
  };

  it("reads the place, region and country from the posting's own location", () => {
    expect(placeParts("Pune, Maharashtra, India")).toEqual({
      locality: "Pune",
      region: "Maharashtra",
      country: "India",
    });
    expect(placeParts("Berlin, Germany")).toEqual({ locality: "Berlin", country: "Germany" });
    expect(placeParts("Bengaluru")).toEqual({ locality: "Bengaluru" });
    expect(placeParts("Remote, India")).toEqual({ country: "India" });
    expect(placeParts("Remote")).toEqual({});
  });

  it("states an office role's address without assuming a country", () => {
    const ld = jobPostingJsonLd({ ...base, job: { ...job, location: "Bengaluru" } });
    expect(ld).toMatchObject({
      "@type": "JobPosting",
      employmentType: "FULL_TIME",
      description: "<p>Full</p>",
      validThrough: job.applicationDeadline,
      jobLocation: { address: { addressLocality: "Bengaluru" } },
    });
    expect(JSON.stringify(ld)).not.toContain("addressCountry");
    expect(ld.hiringOrganization).toEqual({
      "@type": "Organization",
      name: company.name,
      sameAs: company.website,
    });
  });

  it("marks a remote role as telecommute, with the country it hires in when known", () => {
    const remote = { ...job, workMode: "Remote", location: "Remote, India" };
    expect(jobPostingJsonLd({ ...base, job: remote })).toMatchObject({
      jobLocationType: "TELECOMMUTE",
      applicantLocationRequirements: { "@type": "Country", name: "India" },
    });
    const anywhere = jobPostingJsonLd({ ...base, job: { ...remote, location: "Remote" } });
    expect(anywhere).not.toHaveProperty("applicantLocationRequirements");
  });

  it("gives an office role its full address", () => {
    expect(jobPostingJsonLd({ ...base, job }).jobLocation?.address).toEqual({
      "@type": "PostalAddress",
      addressLocality: "Pune",
      addressRegion: "Maharashtra",
      addressCountry: "India",
    });
  });

  it("gives an office role in a known country but no city just the country", () => {
    const ld = jobPostingJsonLd({
      ...base,
      job: { ...job, workMode: "Hybrid", location: "Remote, India" },
    });
    expect(ld).toMatchObject({
      jobLocation: { address: { "@type": "PostalAddress", addressCountry: "India" } },
    });
  });

  it("leaves out what the posting does not have", () => {
    const bare = {
      ...job,
      jobType: "Apprenticeship",
      location: "",
      skillSet: [],
      category: "",
      applicationDeadline: null,
    };
    const ld = jobPostingJsonLd({
      ...base,
      job: bare,
      description: "",
      logo: "https://x/logo.svg",
      company: { ...company, website: "" },
    });
    expect(ld.description).toBe(job.shortJobDescription);
    expect(ld).not.toHaveProperty("employmentType");
    expect(ld).not.toHaveProperty("jobLocation");
    expect(ld).not.toHaveProperty("skills");
    expect(ld).not.toHaveProperty("validThrough");
    expect(ld.hiringOrganization).toEqual({
      "@type": "Organization",
      name: company.name,
      logo: "https://x/logo.svg",
    });
  });
});
