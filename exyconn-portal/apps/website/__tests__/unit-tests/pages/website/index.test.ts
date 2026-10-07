import { describe, expect, it } from 'vitest';
import * as website from '../../../../src/pages/website';
import { BlogPage } from '../../../../src/pages/website/BlogPage';
import { WebsiteSubmissionsPage } from '../../../../src/pages/website/WebsiteSubmissionsPage';

describe('website pages entry point', () => {
  it('exposes every website module screen the router mounts', () => {
    expect(Object.keys(website).sort((a, b) => a.localeCompare(b))).toEqual([
      'BlogPage',
      'CaseStudiesPage',
      'GigsPage',
      'JobCompaniesPage',
      'JobsPage',
      'NavLinksPage',
      'ToolCategoriesPage',
      'ToolsPage',
      'WebsiteSubmissionsPage',
      'WhatsappLeadsPage',
    ]);
    expect(website.BlogPage).toBe(BlogPage);
    expect(website.WebsiteSubmissionsPage).toBe(WebsiteSubmissionsPage);
  });
});
