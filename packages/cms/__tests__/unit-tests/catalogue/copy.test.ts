import { describe, it, expect } from 'vitest';
import {
  FORM_CAPTCHA_COPY,
  FORM_STATUS_COPY,
  LEGAL_FORM_PROPS,
  GRIEVANCE_FORM_PROPS,
} from '../../../src/catalogue/forms.copy';
import { AGENTS_ORDER_PROPS } from '../../../src/catalogue/agents.copy';
import {
  COMPANY_CONTACT_PROPS,
  COMPANY_QUOTE_PROPS,
} from '../../../src/catalogue/company.copy-pages';
import { CAREER_INDEX_PROPS, CAREER_ROLE_LIST_COPY } from '../../../src/catalogue/career.copy';
import { CAREER_COMPANY_PROPS } from '../../../src/catalogue/career.copy-detail';

describe('shared form copy', () => {
  it('has every security-check and send-step message filled in', () => {
    for (const text of [...Object.values(FORM_CAPTCHA_COPY), ...Object.values(FORM_STATUS_COPY)]) {
      expect(text.trim()).not.toBe('');
    }
  });

  it.each([
    ['legal form', LEGAL_FORM_PROPS.copy],
    ['grievance form', GRIEVANCE_FORM_PROPS.copy],
    ['agent order', AGENTS_ORDER_PROPS.text],
    ['contact form', COMPANY_CONTACT_PROPS.form],
    ['quote form', COMPANY_QUOTE_PROPS.text],
  ])('is reused, not copied, by the %s', (_name, copy) => {
    expect(copy.captcha).toBe(FORM_CAPTCHA_COPY);
    expect(copy.status).toBe(FORM_STATUS_COPY);
  });
});

describe('career role-list copy', () => {
  it('is shared by the careers index and every company page', () => {
    expect(CAREER_INDEX_PROPS.roles.list).toBe(CAREER_ROLE_LIST_COPY);
    expect(CAREER_COMPANY_PROPS.openings.list).toBe(CAREER_ROLE_LIST_COPY);
  });

  it('keeps the placeholders the website fills with live values', () => {
    expect(CAREER_ROLE_LIST_COPY.countTemplate).toContain('{shown}');
    expect(CAREER_ROLE_LIST_COPY.countTemplate).toContain('{total}');
    expect(CAREER_ROLE_LIST_COPY.rolesCount).toContain('{n}');
  });
});
