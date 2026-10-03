/** Role shaping for the careers pages: department groups, filters, company cards. */
import { describe, expect, it } from "vitest";
import {
  companyCards,
  GROUP_COMPANY_SLUG,
  groupRolesByDepartment,
  otherRoles,
  roleFilterData,
  roleFilterOptions,
  roleHref,
} from "../../src/lib/career/roles";
import { FIXTURE_COMPANIES, FIXTURE_JOBS } from "../fixtures/careers";

const bySlug = new Map(FIXTURE_COMPANIES.map((company) => [company.slug, company]));
const roles = FIXTURE_JOBS.map((job) => ({ job, company: bySlug.get(job.companySlug)! }));

describe("roles by department", () => {
  it("lists every role once, the biggest team first", () => {
    const groups = groupRolesByDepartment(roles);
    expect(groups.flatMap((group) => group.roles)).toHaveLength(roles.length);
    expect(groups[0]).toMatchObject({ department: "Engineering", id: "roles-engineering" });
    expect(groups.find((group) => group.department === "AI/ML")?.id).toBe("roles-ai-ml");
  });

  it("puts the featured role first, then the newest", () => {
    const [engineering] = groupRolesByDepartment(roles);
    expect(engineering.roles[0].job.isFeatured).toBe(true);
    const plain = roles.map((role) => ({ ...role, job: { ...role.job, isFeatured: false } }));
    const [first] = groupRolesByDepartment(plain);
    expect(first.roles.map((role) => role.job.jobCode)).toEqual(["JOB-001", "JOB-004"]);
  });

  it("returns nothing for no roles", () => {
    expect(groupRolesByDepartment([])).toEqual([]);
  });
});

describe("role filters", () => {
  it("offers a chip group only when it has a real choice", () => {
    const options = roleFilterOptions(roles);
    expect(options.departments.length).toBeGreaterThan(1);
    expect(options.companies.map((option) => option.label)).toContain("Exyconn Group");
    const one = roleFilterOptions(roles.slice(0, 1));
    expect(one).toEqual({ departments: [], modes: [], companies: [] });
  });

  it("tags each row with its team, mode, company and search text", () => {
    expect(roleFilterData(roles[1])).toMatchObject({
      "data-filter-item": true,
      "data-filter-team": "ai-ml",
      "data-filter-mode": "hybrid",
      "data-filter-company": "exyconn",
    });
    expect(roleFilterData(roles[0])["data-search"]).toContain("TypeScript");
  });

  it("links a role under its company", () => {
    expect(roleHref({ companySlug: "exyconn", jobCode: "JOB-001" })).toBe(
      "/career/company/exyconn/job/JOB-001"
    );
  });
});

describe("company cards", () => {
  it("counts each company's roles and keeps the group company apart", () => {
    const cards = companyCards(FIXTURE_COMPANIES, FIXTURE_JOBS);
    expect(cards.companies.map((card) => card.company.slug)).not.toContain(GROUP_COMPANY_SLUG);
    expect(cards.companies.find((card) => card.company.slug === "exyconn")?.openRoles).toBe(3);
    expect(cards.group?.openRoles).toBe(1);
    expect(companyCards(FIXTURE_COMPANIES.slice(0, 1), []).group).toBeUndefined();
  });

  it("lists other roles at the company, not the one being read", () => {
    const [job] = FIXTURE_JOBS;
    const others = otherRoles(
      job,
      FIXTURE_JOBS.filter((one) => one.companySlug === "exyconn")
    );
    expect(others.map((other) => other.jobCode)).toEqual(["JOB-002", "JOB-007"]);
    expect(otherRoles(job, [job])).toEqual([]);
  });
});
