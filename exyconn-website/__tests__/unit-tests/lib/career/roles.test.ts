/** Open roles shaped for the careers pages. */
import { describe, expect, it } from "vitest";
import {
  GROUP_COMPANY_SLUG,
  companyCards,
  groupRolesByDepartment,
  otherRoles,
  roleFilterData,
  roleFilterOptions,
  roleHref,
} from "../../../../src/lib/career/roles";
import { company, job } from "./fixtures";

const acme = company();
const globex = company({ id: "c2", slug: "globex", name: "Globex" });

describe("groupRolesByDepartment", () => {
  it("puts the biggest team first, ties alphabetical, featured then newest within", () => {
    const roles = [
      { job: job({ jobCode: "1", category: "Sales", jobPostDate: "2026-09-01" }) },
      { job: job({ jobCode: "2", category: "Engineering", jobPostDate: "2026-08-01" }) },
      { job: job({ jobCode: "3", category: "Engineering", jobPostDate: "2026-09-10" }) },
      {
        job: job({
          jobCode: "4",
          category: "Engineering",
          isFeatured: true,
          jobPostDate: "2026-01-01",
        }),
      },
      { job: job({ jobCode: "5", category: "Design" }) },
    ];
    const groups = groupRolesByDepartment(roles);
    expect(groups.map((g) => [g.department, g.id])).toEqual([
      ["Engineering", "roles-engineering"],
      ["Design", "roles-design"],
      ["Sales", "roles-sales"],
    ]);
    expect(groups[0]?.roles.map((r) => r.job.jobCode)).toEqual(["4", "3", "2"]);
  });

  it("returns no groups for no roles", () => {
    expect(groupRolesByDepartment([])).toEqual([]);
  });
});

describe("roleFilterOptions", () => {
  it("offers a chip group only when it has more than one choice", () => {
    const options = roleFilterOptions([
      { job: job({ category: "Engineering", workMode: "Remote" }), company: acme },
      { job: job({ category: "Design", workMode: "Remote" }), company: globex },
      { job: job({ category: "Engineering", workMode: "Remote" }), company: acme },
    ]);
    expect(options.departments).toEqual([
      { value: "engineering", label: "Engineering" },
      { value: "design", label: "Design" },
    ]);
    expect(options.modes).toEqual([]);
    expect(options.companies.map((c) => c.label)).toEqual(["Acme", "Globex"]);
  });
});

describe("roleFilterData", () => {
  it("gives FilterBar the team, mode, company and search text", () => {
    const data = roleFilterData({
      job: job({
        title: "Backend Engineer",
        category: "Engineering",
        workMode: "Hybrid",
        location: "Pune",
        skillSet: ["Node", "Mongo"],
      }),
      company: acme,
    });
    expect(data).toEqual({
      "data-filter-item": true,
      "data-filter-team": "engineering",
      "data-filter-mode": "hybrid",
      "data-filter-company": "acme",
      "data-search": "Backend Engineer Engineering Pune Acme Node Mongo",
    });
  });
});

describe("roleHref", () => {
  it("links to the role under its company", () => {
    expect(roleHref({ companySlug: "acme", jobCode: "JOB-9" })).toBe(
      "/career/company/acme/job/JOB-9"
    );
  });
});

describe("companyCards", () => {
  it("counts each company's roles and sets the group company apart", () => {
    const group = company({ id: "g", slug: GROUP_COMPANY_SLUG, name: "Group" });
    const jobs = [
      job({ companySlug: "acme" }),
      job({ companySlug: "acme" }),
      job({ companySlug: GROUP_COMPANY_SLUG }),
    ];
    const cards = companyCards([acme, group, globex], jobs);
    expect(cards.companies).toEqual([
      { company: acme, openRoles: 2 },
      { company: globex, openRoles: 0 },
    ]);
    expect(cards.group).toEqual({ company: group, openRoles: 1 });
  });

  it("has no group card when there is no group company", () => {
    expect(companyCards([acme], []).group).toBeUndefined();
  });
});

describe("otherRoles", () => {
  it("lists other roles, featured then newest, up to the count", () => {
    const current = job({ jobCode: "A" });
    const all = [
      current,
      job({ jobCode: "B", jobPostDate: "2026-09-01" }),
      job({ jobCode: "C", jobPostDate: "2026-09-20" }),
      job({ jobCode: "D", jobPostDate: "2026-01-01", isFeatured: true }),
      job({ jobCode: "E", jobPostDate: "2026-02-01" }),
    ];
    expect(otherRoles(current, all).map((j) => j.jobCode)).toEqual(["D", "C", "B"]);
    expect(otherRoles(current, all, 1).map((j) => j.jobCode)).toEqual(["D"]);
  });
});
