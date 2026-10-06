import { jobPostingJsonLd } from "../../career/structured-data";
import { roleHref } from "../../career/roles";
import { absoluteAsset, marketPageUrl } from "../../content/format";
import { breadcrumbJsonLd } from "../../inner/structured-data";
import {
  getGig,
  getJob,
  getJobCompany,
  getJobs,
  getOpenGigs,
  sanitizeArticleHtml,
} from "../../portal";
import type { Gig, Job, JobCompany } from "../../portal/types";
import { safeHref } from "../../safe-output";
import { crumbsOf, itemCrumbs, itemCrumbsJsonLd } from "./crumbs";
import type { PageLoader } from "./types";

/** cms.detail of 'career.gig': the gig (by its code) and the open gigs beside it. */
export interface GigDetail {
  gig: Gig;
  openGigs: Gig[];
}

/** cms.detail of 'career.company': the company and its open roles. */
export interface CompanyDetail {
  company: JobCompany;
  jobs: Job[];
}

/** cms.detail of 'career.job': the role, its company, the company's roles and the role's URL. */
export interface JobDetail {
  job: Job;
  company: JobCompany;
  companyJobs: Job[];
  url: string;
}

export const gigLoader: PageLoader = async ({ params, site, siteUrl, props }) => {
  const [gig, openGigs] = params.gigId
    ? await Promise.all([getGig(params.gigId, site), getOpenGigs(site)])
    : [null, []];
  if (!gig) {
    return null;
  }
  const detail: GigDetail = { gig, openGigs };
  return {
    item: detail,
    vars: { title: gig.title, summary: gig.shortDescription },
    jsonLd: [breadcrumbJsonLd(itemCrumbs(props, gig.title), siteUrl)],
  };
};

export const companyLoader: PageLoader = async ({ params, site, siteUrl, props }) => {
  const [company, jobs] = params.companySlug
    ? await Promise.all([
        getJobCompany(params.companySlug, site),
        getJobs(params.companySlug, site),
      ])
    : [null, []];
  if (!company) {
    return null;
  }
  const detail: CompanyDetail = { company, jobs };
  return {
    item: detail,
    vars: {
      name: company.name,
      tagline: company.tagline,
      industry: company.industry,
      jobCount: String(jobs.length),
      logo: safeHref(company.logo),
    },
    jsonLd: [breadcrumbJsonLd(itemCrumbs(props, company.name), siteUrl)],
  };
};

export const jobLoader: PageLoader = async (input) => {
  const { params, site, market, siteUrl, props } = input;
  const { companySlug, jobId } = params;
  const [company, job, companyJobs] =
    companySlug && jobId
      ? await Promise.all([
          getJobCompany(companySlug, site),
          getJob(jobId, site),
          getJobs(companySlug, site),
        ])
      : [null, null, []];
  // Not found, or a job that belongs to another company.
  if (!company || job?.companySlug !== company.slug) {
    return null;
  }
  const url = marketPageUrl(siteUrl, market, roleHref(job));
  const detail: JobDetail = { job, company, companyJobs, url };
  const crumbs = [
    ...crumbsOf(props),
    { label: company.name, href: `/career/company/${company.slug}` },
    { label: job.title },
  ];
  return {
    item: detail,
    vars: {
      title: job.title,
      company: company.name,
      summary: job.shortJobDescription,
      category: job.category,
      skills: job.skillSet.join(", "),
      logo: safeHref(company.logo),
    },
    jsonLd: [
      jobPostingJsonLd({
        job,
        company,
        description: sanitizeArticleHtml(job.jobDescription),
        url,
        logo: absoluteAsset(siteUrl, safeHref(company.logo)),
      }),
      itemCrumbsJsonLd(crumbs, input, url),
    ],
  };
};
