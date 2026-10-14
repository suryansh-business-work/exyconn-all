import { ctaActionSchema, documentSchema } from '@exyconn/wa-flow';
import { ctaStarter } from '../../../../../../../src/admin/workflows/editor/inspector/forms/cta/cta-starter';
import { docSectionStarter } from '../../../../../../../src/admin/workflows/editor/inspector/forms/document/doc-section-starter';

const sectionSchema = documentSchema.shape.preview.shape.sections.element;

describe('ctaStarter', () => {
  it('starts a call with an empty phone, keeping the title', () => {
    expect(ctaStarter('call', 'Ring us')).toEqual({ kind: 'call', title: 'Ring us', phone: '' });
  });

  it('starts a calendar event at the chosen slot, 30 minutes long', () => {
    const action = ctaStarter('calendar', 'Save');
    expect(action).toEqual({
      kind: 'calendar',
      title: 'Save',
      event: { title: '', start: '{{slot}}', durationMin: 30 },
    });
  });

  it('starts a link with a valid https prefix', () => {
    const action = ctaStarter('url', 'Open');
    expect(action).toEqual({ kind: 'url', title: 'Open', url: 'https://' });
    expect(ctaActionSchema.safeParse(action).success).toBe(true);
  });
});

describe('docSectionStarter', () => {
  it('starts a table with two columns and no rows', () => {
    const section = docSectionStarter('table', 'Results');
    expect(section).toEqual({
      kind: 'table',
      heading: 'Results',
      columns: ['Item', 'Value'],
      rows: [],
    });
    expect(sectionSchema.safeParse(section).success).toBe(true);
  });

  it('starts a paragraph and a fields section, valid as they are', () => {
    expect(docSectionStarter('text')).toEqual({ kind: 'text', heading: undefined, text: '' });
    const fields = docSectionStarter('fields', 'Patient');
    expect(fields).toEqual({ kind: 'fields', heading: 'Patient', fields: [] });
    expect(sectionSchema.safeParse(fields).success).toBe(true);
  });
});
