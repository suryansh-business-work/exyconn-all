/** JobPosting JSON-LD for a role's page, and how a location is read into place parts. */
import { describe, expect, it } from "vitest";
import { jobPostingJsonLd, placeParts } from "../../../../src/lib/career/structured-data";
import { company, job } from "./fixtures";

const URL_ = "https://exyconn.com/career/company/acme/job/JOB-1";

describe("placeParts", () => {
  it("reads locality, region and country", () => {
    expect(placeParts("Pune, Maharashtra, India")).toEqual({
      locality: "Pune",
      region: "Maharashtra",
      country: "India",
    });
  });

  it("reads a locality and country without a region", () => {
    expect(placeParts("Pune; India")).toEqual({ locality: "Pune", country: "India" });
  });

  it("reads a single part as a locality, or a country when a way of working was dropped", () => {
    expect(placeParts("Bengaluru")).toEqual({ locality: "Bengaluru" });
    expect(placeParts("Remote, India")).toEqual({ country: "India" });
  });

  it("is no place for a way of working or blank text", () => {
    expect(placeParts("Remote")).toEqual({});
    expect(placeParts("Hybrid | Anywhere")).toEqual({});
    expect(placeParts("")).toEqual({});
  });
});

describe("jobPostingJsonLd", () => {
  it("describes an office role with every field the posting has", () => {
    const ld = jobPostingJsonLd({
      job: job({
        skillSet: ["Node", "React"],
        applicationDeadline: "2026-12-31",
        location: "Pune, Maharashtra, India",
      }),
      company: company({ website: "https://acme.example" }),
      description: "<p>Full description</p>",
      url: URL_,
      logo: "https://cdn.example/logo.png",
    });
    expect(ld).toEqual({
      "@context": "https://schema.org",
      "@type": "JobPosting",
      title: "Engineer",
      description: "<p>Full description</p>",
      datePosted: "2026-09-01",
      validThrough: "2026-12-31",
      employmentType: "FULL_TIME",
      identifier: { "@type": "PropertyValue", name: "Acme", value: "JOB-1" },
      hiringOrganization: {
        "@type": "Organization",
        name: "Acme",
        sameAs: "https://acme.example",
        logo: "https://cdn.example/logo.png",
      },
      jobLocation: {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Pune",
          addressRegion: "Maharashtra",
          addressCountry: "India",
        },
      },
      skills: "Node, React",
      occupationalCategory: "Engineering",
      directApply: true,
      url: URL_,
    });
  });

  it("leaves out what the posting lacks", () => {
    const ld = jobPostingJsonLd({
      job: job({ jobType: "Seasonal", category: "", location: "Remote", workMode: "On-site" }),
      company: company(),
      description: "",
      url: URL_,
      logo: "",
    });
    expect(ld.description).toBe("Builds things");
    for (const key of [
      "validThrough",
      "employmentType",
      "skills",
      "occupationalCategory",
      "jobLocation",
    ]) {
      expect(ld).not.toHaveProperty(key);
    }
    expect(ld.hiringOrganization).toEqual({ "@type": "Organization", name: "Acme" });
  });

  it("gives an office role with only a country an address of just the country", () => {
    const ld = jobPostingJsonLd({
      job: job({ location: "Remote, India" }),
      company: company(),
      description: "x",
      url: URL_,
      logo: "",
    });
    expect(ld).toHaveProperty("jobLocation", {
      "@type": "Place",
      address: { "@type": "PostalAddress", addressCountry: "India" },
    });
  });

  it("marks a remote role as telecommute, with the country it hires in", () => {
    const ld = jobPostingJsonLd({
      job: job({ workMode: "Remote", location: "Remote, India", jobType: "Contract" }),
      company: company(),
      description: "x",
      url: URL_,
      logo: "",
    });
    expect(ld).toMatchObject({
      employmentType: "CONTRACTOR",
      jobLocationType: "TELECOMMUTE",
      applicantLocationRequirements: { "@type": "Country", name: "India" },
    });
    expect(ld).not.toHaveProperty("jobLocation");
  });

  it("states no country for a remote role that names none", () => {
    const ld = jobPostingJsonLd({
      job: job({ workMode: "Remote", location: "Anywhere", jobType: "Internship" }),
      company: company(),
      description: "x",
      url: URL_,
      logo: "",
    });
    expect(ld).toMatchObject({ jobLocationType: "TELECOMMUTE", employmentType: "INTERN" });
    expect(ld).not.toHaveProperty("applicantLocationRequirements");
  });
});
