import { describe, expect, it } from 'vitest';
import { auditMeta, type PageMeta } from '../../src';

const good: PageMeta = {
  title: 'Merge PDF — Free Online Tool | Exyconn Tools',
  description: 'Combine PDFs in your browser.',
  canonical: 'https://tools.exyconn.com/tools/merge-pdf',
  image: { url: 'https://tools.exyconn.com/og.png', alt: 'Exyconn Tools' },
};

describe('auditMeta', () => {
  it('passes a complete page', () => {
    expect(auditMeta(good)).toEqual([]);
  });

  it('warns on long titles and descriptions without changing them', () => {
    const meta = { ...good, title: 'x'.repeat(61), description: 'y'.repeat(156) };
    const warnings = auditMeta(meta);
    expect(warnings.map((warning) => warning.field)).toEqual(['title', 'description']);
    expect(meta.title).toHaveLength(61);
  });

  it('honours custom limits', () => {
    expect(auditMeta(good, { title: 10, description: 10 })).toHaveLength(2);
  });

  it('warns on empty values, a relative canonical and a missing image', () => {
    const warnings = auditMeta({ title: ' ', description: '', canonical: '/x' });
    expect(warnings).toEqual([
      { field: 'title', message: 'Title is empty.' },
      { field: 'description', message: 'Description is empty.' },
      { field: 'canonical', message: 'Canonical must be an absolute http(s) URL.' },
      { field: 'image', message: 'No share image; social cards will be text only.' },
    ]);
  });

  it('warns on an image without alt text', () => {
    expect(auditMeta({ ...good, image: { url: 'https://a.b/i.png' } })).toEqual([
      { field: 'image', message: 'Share image has no alt text.' },
    ]);
  });
});
