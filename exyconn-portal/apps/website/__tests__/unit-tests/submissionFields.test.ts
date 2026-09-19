import { describe, expect, it } from 'vitest';
import {
  entriesOf,
  humanize,
  senderOf,
  summaryOf,
} from '../../src/pages/website/submission.fields';

describe('submission fields', () => {
  it('turns keys and form types into words', () => {
    expect(humanize('firstName')).toBe('First name');
    expect(humanize('india-offer')).toBe('India offer');
    expect(humanize('job_application')).toBe('Job application');
  });

  it('names the sender from whatever the form asked for', () => {
    expect(senderOf({ firstName: 'Asha', lastName: 'Rao', email: 'a@x.co' })).toBe(
      'Asha Rao <a@x.co>',
    );
    expect(senderOf({ fullName: 'Ravi K' })).toBe('Ravi K');
    expect(senderOf({ email: 'n@x.co' })).toBe('n@x.co');
    expect(senderOf({})).toBe('—');
    expect(senderOf(null)).toBe('—');
    expect(senderOf(['a'])).toBe('—');
  });

  it('sums up what it is about, shortened', () => {
    expect(summaryOf({ subject: 'Pricing', message: 'Hi' })).toBe('Pricing');
    expect(summaryOf({ message: 'x'.repeat(100) })).toHaveLength(80);
    expect(summaryOf({ message: 'x'.repeat(100) }).endsWith('…')).toBe(true);
    expect(summaryOf({ email: 'a@x.co' })).toBe('—');
  });

  it('lists the filled-in fields with links for email and phone', () => {
    expect(
      entriesOf({
        firstName: 'Asha',
        email: 'a@x.co',
        phone: '+91 98765-43210',
        company: '',
        budget: null,
        tags: ['ai', 'web'],
        count: 3,
      }),
    ).toEqual([
      { key: 'firstName', label: 'First name', value: 'Asha', link: undefined },
      { key: 'email', label: 'Email', value: 'a@x.co', link: 'mailto:a@x.co' },
      { key: 'phone', label: 'Phone', value: '+91 98765-43210', link: 'tel:+919876543210' },
      { key: 'tags', label: 'Tags', value: '["ai","web"]', link: undefined },
      { key: 'count', label: 'Count', value: '3', link: undefined },
    ]);
    expect(entriesOf('not an object')).toEqual([]);
  });
});
