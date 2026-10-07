/** The careers templates' loaders: a gig, a company and a role. */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { companyLoader, gigLoader, jobLoader } from "../../../../../src/lib/cms/loaders/career";
import { getGig, getJob, getJobCompany, getJobs, getOpenGigs } from "../../../../../src/lib/portal";
import { company, gig, job } from "../../career/fixtures";
import { CRUMBS, loaderInput, SITE_URL } from "./input";

vi.mock("../../../../../src/lib/portal", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../../src/lib/portal")>()),
  getGig: vi.fn(),
  getJob: vi.fn(),
  getJobCompany: vi.fn(),
  getJobs: vi.fn(),
  getOpenGigs: vi.fn(),
}));

const mocks = [getGig, getJob, getJobCompany, getJobs, getOpenGigs].map((fn) => vi.mocked(fn));

beforeEach(() => {
  mocks.forEach((mock) => mock.mockReset());
});

describe("gigLoader", () => {
  it("is a 404 without a gig code or a gig", async () => {
    await expect(gigLoader(loaderInput({}))).resolves.toBeNull();
    expect(getGig).not.toHaveBeenCalled();
    vi.mocked(getGig).mockResolvedValue(null);
    vi.mocked(getOpenGigs).mockResolvedValue([]);
    await expect(gigLoader(loaderInput({ gigId: "GIG-9" }))).resolves.toBeNull();
    expect(getGig).toHaveBeenCalledWith("GIG-9", "exyconn");
  });

  it("reads the gig and the open gigs beside it", async () => {
    const found = gig();
    const open = [found, gig({ gigCode: "GIG-2" })];
    vi.mocked(getGig).mockResolvedValue(found);
    vi.mocked(getOpenGigs).mockResolvedValue(open);
    const load = await gigLoader(loaderInput({ gigId: "GIG-1" }));
    expect(load?.item).toEqual({ gig: found, openGigs: open });
    expect(load?.vars).toEqual({ title: "Logo design", summary: "A new logo" });
    expect(load?.jsonLd?.[0].itemListElement).toHaveLength(CRUMBS.length + 1);
  });
});

describe("companyLoader", () => {
  it("is a 404 without a company slug or a company", async () => {
    await expect(companyLoader(loaderInput({}))).resolves.toBeNull();
    expect(getJobCompany).not.toHaveBeenCalled();
    vi.mocked(getJobCompany).mockResolvedValue(null);
    vi.mocked(getJobs).mockResolvedValue([]);
    await expect(companyLoader(loaderInput({ companySlug: "gone" }))).resolves.toBeNull();
  });

  it("reads the company with its roles and refuses an unsafe logo", async () => {
    const found = company({ tagline: "We build", industry: "Software", logo: "javascript:x" });
    const roles = [job(), job({ jobCode: "JOB-2" })];
    vi.mocked(getJobCompany).mockResolvedValue(found);
    vi.mocked(getJobs).mockResolvedValue(roles);
    const load = await companyLoader(loaderInput({ companySlug: "acme" }));
    expect(getJobs).toHaveBeenCalledWith("acme", "exyconn");
    expect(load?.item).toEqual({ company: found, jobs: roles });
    expect(load?.vars).toEqual({
      name: "Acme",
      tagline: "We build",
      industry: "Software",
      jobCount: "2",
      logo: "",
    });
  });
});

describe("jobLoader", () => {
  it("is a 404 without both the company slug and the job id", async () => {
    await expect(jobLoader(loaderInput({ companySlug: "acme" }))).resolves.toBeNull();
    await expect(jobLoader(loaderInput({ jobId: "JOB-1" }))).resolves.toBeNull();
    expect(getJob).not.toHaveBeenCalled();
  });

  it("is a 404 when the company or the job is missing, or the job is another company's", async () => {
    vi.mocked(getJobs).mockResolvedValue([]);
    const params = { companySlug: "acme", jobId: "JOB-1" };
    vi.mocked(getJobCompany).mockResolvedValueOnce(null);
    vi.mocked(getJob).mockResolvedValueOnce(job());
    await expect(jobLoader(loaderInput(params))).resolves.toBeNull();
    vi.mocked(getJobCompany).mockResolvedValueOnce(company());
    vi.mocked(getJob).mockResolvedValueOnce(null);
    await expect(jobLoader(loaderInput(params))).resolves.toBeNull();
    vi.mocked(getJobCompany).mockResolvedValueOnce(company());
    vi.mocked(getJob).mockResolvedValueOnce(job({ companySlug: "other" }));
    await expect(jobLoader(loaderInput(params))).resolves.toBeNull();
  });

  it("reads the role at its market URL with a JobPosting and the company in the trail", async () => {
    const role = job({
      skillSet: ["TypeScript", "Node"],
      jobDescription: "<p>Build</p><script>alert(1)</script>",
    });
    const employer = company({ logo: "/logos/acme.png" });
    vi.mocked(getJobCompany).mockResolvedValue(employer);
    vi.mocked(getJob).mockResolvedValue(role);
    vi.mocked(getJobs).mockResolvedValue([role]);
    const load = await jobLoader(loaderInput({ companySlug: "acme", jobId: "JOB-1" }));
    const url = `${SITE_URL}/en-in/career/company/acme/job/JOB-1`;
    expect(load?.item).toEqual({ job: role, company: employer, companyJobs: [role], url });
    expect(load?.vars).toEqual({
      title: "Engineer",
      company: "Acme",
      summary: "Builds things",
      category: "Engineering",
      skills: "TypeScript, Node",
      logo: "/logos/acme.png",
    });
    const [posting, crumbs] = load?.jsonLd ?? [];
    expect(posting).toMatchObject({
      "@type": "JobPosting",
      url,
      hiringOrganization: { name: "Acme", logo: `${SITE_URL}/logos/acme.png` },
    });
    expect(posting.description).toContain("<p>Build</p>");
    expect(posting.description).not.toContain("script");
    expect(crumbs.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/en-in` },
      { "@type": "ListItem", position: 2, name: "Section", item: `${SITE_URL}/en-in/section` },
      {
        "@type": "ListItem",
        position: 3,
        name: "Acme",
        item: `${SITE_URL}/en-in/career/company/acme`,
      },
      { "@type": "ListItem", position: 4, name: "Engineer", item: url },
    ]);
  });

  it("publishes the posting without a logo when the company has none", async () => {
    vi.mocked(getJobCompany).mockResolvedValue(company());
    vi.mocked(getJob).mockResolvedValue(job());
    vi.mocked(getJobs).mockResolvedValue([]);
    const load = await jobLoader(loaderInput({ companySlug: "acme", jobId: "JOB-1" }, {}));
    expect(load?.jsonLd?.[0].hiringOrganization).not.toHaveProperty("logo");
    expect(load?.vars?.logo).toBe("");
  });
});
