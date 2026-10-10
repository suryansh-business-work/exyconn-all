import { describe, expect, it } from 'vitest';
import { defaultFormValues, defaultSocialLinks, fontSizes, type SignatureFormValues } from '../types';
import { generateSignatureHTML } from './generateSignature';

const FULL: SignatureFormValues = {
  ...defaultFormValues,
  fullName: 'Ada Lovelace',
  jobTitle: 'Engineer',
  department: 'Research',
  company: 'Analytical Engines',
  email: 'ada@example.org',
  phone: '+1 555 0100',
  mobile: '+1 555 0199',
  address: '12 Babbage Street',
  logoUrl: 'https://img.example/logo.png',
  profilePhotoUrl: 'https://img.example/ada.jpg',
  bannerUrl: 'https://img.example/banner.jpg',
  ctaText: 'Book a call',
  ctaUrl: 'https://cal.example/ada',
  disclaimer: 'Confidential.',
  primaryColor: '#112233',
  secondaryColor: '#445566',
  fontFamily: 'Georgia, serif',
  socialLinks: defaultSocialLinks.map((link) => ({
    ...link,
    enabled: true,
    url: `https://${link.platform}.example/ada`,
  })),
  customFields: [
    { id: 'a', label: 'Booking', value: 'https://book.example', type: 'link' },
    { id: 'b', label: 'Fax', value: '+1 555 0111', type: 'phone' },
    { id: 'c', label: 'Pronouns', value: 'she/her', type: 'text' },
  ],
};

const BARE: SignatureFormValues = { ...defaultFormValues, fullName: 'Bare Name' };

const parse = (values: SignatureFormValues) =>
  new DOMParser().parseFromString(generateSignatureHTML(values), 'text/html');
const hrefs = (doc: Document) => [...doc.querySelectorAll('a')].map((a) => a.getAttribute('href'));
const srcs = (doc: Document) => [...doc.querySelectorAll('img')].map((img) => img.getAttribute('src'));
const text = (doc: Document) => (doc.body.textContent ?? '').replaceAll(/\s+/g, ' ').trim();

describe('generateSignatureHTML', () => {
  describe('professional template', () => {
    it('renders every field of a complete signature', () => {
      const doc = parse({ ...FULL, template: 'professional' });
      const content = text(doc);
      expect(content).toContain('Ada Lovelace');
      expect(content).toContain('Engineer | Research');
      expect(content).toContain('Analytical Engines');
      expect(content).toContain('12 Babbage Street');
      expect(content).toContain('Book a call');
      expect(content).toContain('Confidential.');
      expect(hrefs(doc)).toEqual(
        expect.arrayContaining([
          'mailto:ada@example.org',
          'tel:+1 555 0100',
          'tel:+1 555 0199',
          'https://cal.example/ada',
          'https://book.example',
          'tel:+1 555 0111',
        ])
      );
      expect(srcs(doc)).toEqual([
        'https://img.example/ada.jpg',
        'https://img.example/logo.png',
        'https://img.example/banner.jpg',
      ]);
      expect(doc.querySelector('table')?.getAttribute('style')).toContain('font-family: Georgia, serif');
    });

    it('lists custom fields by type: link, phone, plain text', () => {
      const doc = parse({ ...FULL, template: 'professional' });
      const rows = [...doc.querySelectorAll('strong')].map((strong) => strong.parentElement as HTMLElement);
      const byLabel = (label: string) => rows.find((row) => row.textContent?.startsWith(`${label}:`)) as HTMLElement;
      expect(byLabel('Booking').querySelector('a')?.getAttribute('href')).toBe('https://book.example');
      expect(byLabel('Fax').querySelector('a')?.getAttribute('href')).toBe('tel:+1 555 0111');
      expect(byLabel('Pronouns').querySelector('a')).toBeNull();
      expect(byLabel('Pronouns').textContent).toBe('Pronouns: she/her');
    });

    it('renders the six social icons in the platform colours', () => {
      const doc = parse({ ...FULL, template: 'professional' });
      const social = [...doc.querySelectorAll('a')].filter((a) => a.querySelector('svg'));
      expect(social.map((a) => a.getAttribute('href'))).toEqual(
        defaultSocialLinks.map((link) => `https://${link.platform}.example/ada`)
      );
      expect(social.map((a) => a.style.color)).toEqual([
        'rgb(0, 119, 181)',
        'rgb(0, 0, 0)',
        'rgb(24, 119, 242)',
        'rgb(228, 64, 95)',
        'rgb(51, 51, 51)',
        'rgb(85, 85, 85)',
      ]);
    });

    it('leaves out everything that is empty', () => {
      const doc = parse({ ...BARE, template: 'professional' });
      expect(text(doc)).toBe('Bare Name');
      expect(doc.querySelectorAll('a')).toHaveLength(0);
      expect(doc.querySelectorAll('img')).toHaveLength(0);
    });

    it('shows the job title without a department separator when there is no department', () => {
      const doc = parse({ ...BARE, jobTitle: 'Founder', template: 'professional' });
      expect(text(doc)).toBe('Bare Name Founder');
    });

    it('skips social links that are disabled or have no URL', () => {
      const doc = parse({
        ...BARE,
        socialLinks: [
          { platform: 'linkedin', url: 'https://linkedin.example/x', enabled: false },
          { platform: 'github', url: '', enabled: true },
          { platform: 'website', url: 'https://site.example', enabled: true },
        ],
      });
      expect(hrefs(doc)).toEqual(['https://site.example']);
    });

    it('needs both CTA text and URL for the button, and links the banner to the CTA or #', () => {
      const onlyText = parse({ ...BARE, ctaText: 'Book', bannerUrl: 'https://img.example/b.png' });
      expect(text(onlyText)).not.toContain('Book');
      expect(hrefs(onlyText)).toEqual(['#']);

      const onlyUrl = parse({ ...BARE, ctaUrl: 'https://cal.example' });
      expect(hrefs(onlyUrl)).toEqual([]);

      const withBoth = parse({ ...BARE, ctaText: 'Book', ctaUrl: 'https://cal.example' });
      expect(hrefs(withBoth)).toEqual(['https://cal.example']);
    });

    it('sizes text by the chosen font size', () => {
      const html = generateSignatureHTML({ ...BARE, fontSize: 'large' });
      expect(html).toContain(`font-size: ${fontSizes.large.title}px`);
      expect(html).not.toContain(`font-size: ${fontSizes.medium.title}px`);
    });
  });

  describe('modern template', () => {
    it('renders the contact lines, department after the company, photo and logo', () => {
      const doc = parse({ ...FULL, template: 'modern' });
      const content = text(doc);
      expect(content).toContain('Engineer');
      expect(content).toContain('Analytical Engines • Research');
      expect(content).toContain('ada@example.org');
      expect(content).toContain('+1 555 0100');
      expect(content).toContain('12 Babbage Street');
      expect(hrefs(doc)).toEqual(
        expect.arrayContaining(['mailto:ada@example.org', 'tel:+1 555 0100', 'https://cal.example/ada'])
      );
      expect(hrefs(doc)).not.toContain('tel:+1 555 0199');
      expect(srcs(doc)).toEqual([
        'https://img.example/ada.jpg',
        'https://img.example/logo.png',
        'https://img.example/banner.jpg',
      ]);
      expect(content).toContain('Confidential.');
    });

    it('shows the company alone when there is no department, and nothing for empty fields', () => {
      expect(text(parse({ ...BARE, company: 'Acme', template: 'modern' }))).toBe('Bare Name Acme');
      const bare = parse({ ...BARE, template: 'modern' });
      expect(text(bare)).toBe('Bare Name');
      expect(bare.querySelectorAll('a, img')).toHaveLength(0);
    });
  });

  describe('minimal template', () => {
    it('joins job title and company with @ and the contacts with a bullet', () => {
      const doc = parse({ ...FULL, template: 'minimal' });
      const content = text(doc);
      expect(content).toContain('Engineer @ Analytical Engines');
      expect(content).toContain('ada@example.org • +1 555 0100');
      expect(hrefs(doc)).toEqual(
        expect.arrayContaining(['mailto:ada@example.org', 'tel:+1 555 0100', 'https://cal.example/ada'])
      );
      expect(content).toContain('Pronouns: she/her');
      expect(content).toContain('Confidential.');
      expect(doc.querySelectorAll('img')).toHaveLength(0);
    });

    it('shows a lone job title, a lone company, and a single contact', () => {
      expect(text(parse({ ...BARE, jobTitle: 'CTO', template: 'minimal' }))).toBe('Bare Name CTO');
      expect(text(parse({ ...BARE, company: 'Acme', template: 'minimal' }))).toBe('Bare Name Acme');
      const emailOnly = parse({ ...BARE, email: 'a@b.co', template: 'minimal' });
      expect(text(emailOnly)).toBe('Bare Name a@b.co');
      const phoneOnly = parse({ ...BARE, phone: '123', template: 'minimal' });
      expect(hrefs(phoneOnly)).toEqual(['tel:123']);
    });

    it('renders only the name when nothing else is set', () => {
      expect(text(parse({ ...BARE, template: 'minimal' }))).toBe('Bare Name');
    });
  });

  describe('creative template', () => {
    it('renders photo, logo, contacts, custom fields, social links, CTA, banner and disclaimer', () => {
      const doc = parse({ ...FULL, template: 'creative' });
      const content = text(doc);
      expect(content).toContain('Ada Lovelace');
      expect(content).toContain('Engineer');
      expect(content).toContain('Analytical Engines');
      expect(content).toContain('12 Babbage Street');
      expect(content).toContain('+1 555 0100');
      expect(content).toContain('Book a call');
      expect(hrefs(doc)).toEqual(expect.arrayContaining(['mailto:ada@example.org', 'https://book.example']));
      expect(srcs(doc)).toEqual([
        'https://img.example/ada.jpg',
        'https://img.example/logo.png',
        'https://img.example/banner.jpg',
      ]);
      expect(content).toContain('Confidential.');
    });

    it('renders only the name when nothing else is set', () => {
      const doc = parse({ ...BARE, template: 'creative' });
      expect(text(doc)).toBe('Bare Name');
      expect(doc.querySelectorAll('a, img')).toHaveLength(0);
    });
  });
});
