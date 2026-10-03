/**
 * Open roles shaped for the careers pages: grouped by department, the filter chips, and the
 * company cards. Pure functions over portal rows — the rows themselves come from the portal.
 */
import { chipOptions, filterTokens, sortableDate } from "../content/format";
import { slugify } from "../inner/headings";
import type { Job, JobCompany, JobWithCompany } from "../portal/types";

/**
 * The group company advertises cross-brand roles; it gets its own card on the careers page
 * instead of a place in the company grid.
 */
export const GROUP_COMPANY_SLUG = "group";

export interface RoleGroup<T> {
  department: string;
  /** Anchor/heading id, e.g. "roles-engineering". */
  id: string;
  roles: T[];
}

/** Featured first, then the newest posting. */
const byFeaturedThenNewest = (a: Job, b: Job): number =>
  Number(b.isFeatured) - Number(a.isFeatured) ||
  sortableDate(b.jobPostDate) - sortableDate(a.jobPostDate);

/**
 * Roles under their department (the job's category): the biggest team first, ties
 * alphabetical. Every role appears exactly once.
 */
export const groupRolesByDepartment = <T extends { job: Job }>(
  roles: readonly T[]
): RoleGroup<T>[] => {
  const groups = new Map<string, T[]>();
  roles.forEach((role) => {
    const department = role.job.category;
    groups.set(department, [...(groups.get(department) ?? []), role]);
  });
  return [...groups.entries()]
    .toSorted(([a, left], [b, right]) => right.length - left.length || a.localeCompare(b))
    .map(([department, members]) => ({
      department,
      id: `roles-${slugify(department)}`,
      roles: members.toSorted((x, y) => byFeaturedThenNewest(x.job, y.job)),
    }));
};

/** The chips the roles list can be filtered by. A group with a single choice is left out. */
export const roleFilterOptions = (roles: readonly JobWithCompany[]) => {
  const useful = (labels: string[]) => {
    const options = chipOptions(labels, 12);
    return options.length > 1 ? options : [];
  };
  return {
    departments: useful(roles.map(({ job }) => job.category)),
    modes: useful(roles.map(({ job }) => job.workMode)),
    companies: useful(roles.map(({ company }) => company.name)),
  };
};

/** `data-*` attributes FilterBar reads from one role row. */
export const roleFilterData = ({ job, company }: JobWithCompany) => ({
  "data-filter-item": true,
  "data-filter-team": filterTokens([job.category]),
  "data-filter-mode": filterTokens([job.workMode]),
  "data-filter-company": filterTokens([company.name]),
  "data-search": [job.title, job.category, job.location, company.name, ...job.skillSet].join(" "),
});

/** The role's page. */
export const roleHref = (job: Pick<Job, "companySlug" | "jobCode">): string =>
  `/career/company/${job.companySlug}/job/${job.jobCode}`;

/** A company's card on the careers page, with how many roles it has open. */
export interface CompanyCard {
  company: JobCompany;
  openRoles: number;
}

/** Companies in portal order, the group company apart (see GROUP_COMPANY_SLUG). */
export const companyCards = (
  companies: readonly JobCompany[],
  jobs: readonly Job[]
): { companies: CompanyCard[]; group: CompanyCard | undefined } => {
  const cards = companies.map((company) => ({
    company,
    openRoles: jobs.filter((job) => job.companySlug === company.slug).length,
  }));
  return {
    companies: cards.filter(({ company }) => company.slug !== GROUP_COMPANY_SLUG),
    group: cards.find(({ company }) => company.slug === GROUP_COMPANY_SLUG),
  };
};

/** Up to `count` other roles at the same company, newest first. */
export const otherRoles = (job: Job, companyJobs: readonly Job[], count = 3): Job[] =>
  companyJobs
    .filter((other) => other.jobCode !== job.jobCode)
    .toSorted(byFeaturedThenNewest)
    .slice(0, count);
