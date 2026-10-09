import { describe, it, expect } from 'vitest';
import { CMS_COMPONENTS, cmsComponent } from '../../../src/catalogue';
import { CHROME_COMPONENTS } from '../../../src/catalogue/chrome';
import { HOME_COMPONENTS } from '../../../src/catalogue/home';
import { AGENTS_COMPONENTS } from '../../../src/catalogue/agents';
import { COMPANY_COMPONENTS } from '../../../src/catalogue/company';
import { FORMS_COMPONENTS } from '../../../src/catalogue/forms';
import { LEGAL_COMPONENTS } from '../../../src/catalogue/legal';
import { OFFER_COMPONENTS } from '../../../src/catalogue/offer';
import { DETAIL_COMPONENTS } from '../../../src/catalogue/detail';
import { SERVICE_COMPONENTS } from '../../../src/catalogue/service';
import { AI_COMPONENTS } from '../../../src/catalogue/ai';
import { AISERVICE_COMPONENTS } from '../../../src/catalogue/aiservice';
import { BLOG_COMPONENTS } from '../../../src/catalogue/blog';
import { CASESTUDY_COMPONENTS } from '../../../src/catalogue/casestudy';
import { CAREER_COMPONENTS } from '../../../src/catalogue/career';
import { TOOLS_COMPONENTS } from '../../../src/catalogue/tools';
import { POLICY_COMPONENTS } from '../../../src/catalogue/policy';
import { NEWSLETTER_COMPONENTS } from '../../../src/catalogue/newsletter';
import type { CmsComponentDef } from '../../../src/catalogue/types';

/** Every area module, with the key prefix its entries share. */
const AREAS: ReadonlyArray<readonly [string, readonly CmsComponentDef[]]> = [
  ['chrome', CHROME_COMPONENTS],
  ['home', HOME_COMPONENTS],
  ['company', COMPANY_COMPONENTS],
  ['legal', LEGAL_COMPONENTS],
  ['forms', FORMS_COMPONENTS],
  ['agents', AGENTS_COMPONENTS],
  ['offer', OFFER_COMPONENTS],
  ['detail', DETAIL_COMPONENTS],
  ['service', SERVICE_COMPONENTS],
  ['ai', AI_COMPONENTS],
  ['aiservice', AISERVICE_COMPONENTS],
  ['blog', BLOG_COMPONENTS],
  ['casestudy', CASESTUDY_COMPONENTS],
  ['career', CAREER_COMPONENTS],
  ['tools', TOOLS_COMPONENTS],
  ['policy', POLICY_COMPONENTS],
  ['newsletter', NEWSLETTER_COMPONENTS],
];

describe('CMS_COMPONENTS', () => {
  it('aggregates every area, in area order, and nothing else', () => {
    const expected = AREAS.flatMap(([, components]) => components);
    expect(CMS_COMPONENTS).toEqual(expected);
    expect(CMS_COMPONENTS).toHaveLength(expected.length);
  });

  it.each(AREAS)('gives every %s entry a key prefixed with its area', (area, components) => {
    expect(components.length).toBeGreaterThan(0);
    for (const component of components) {
      expect(component.key).toMatch(new RegExp(String.raw`^${area}\.[a-z][a-z-]*$`));
    }
  });

  it('has unique keys', () => {
    const keys = CMS_COMPONENTS.map((component) => component.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('has unique labels within a category, so the block panel is unambiguous', () => {
    const labels = CMS_COMPONENTS.map((component) => `${component.category}/${component.label}`);
    expect(new Set(labels).size).toBe(labels.length);
  });
});

describe('cmsComponent', () => {
  it('finds every catalogue entry by its key', () => {
    for (const component of CMS_COMPONENTS) {
      expect(cmsComponent(component.key)).toBe(component);
    }
  });

  it('returns undefined for an unknown, empty or differently-cased key', () => {
    expect(cmsComponent('home.nope')).toBeUndefined();
    expect(cmsComponent('')).toBeUndefined();
    expect(cmsComponent('HOME.HERO')).toBeUndefined();
  });
});
