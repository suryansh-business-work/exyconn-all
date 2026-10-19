import { isSlug, SLUG_RULE } from '../../../../../src/modules/crm/meetings/meeting.slug';

describe('isSlug', () => {
  it('accepts lower-case letters, digits and dashes between 3 and 60 characters', () => {
    expect(isSlug('abc')).toBe(true);
    expect(isSlug('intro-call-30')).toBe(true);
    expect(isSlug('a'.repeat(60))).toBe(true);
  });

  it('refuses a link part that is too short or too long', () => {
    expect(isSlug('ab')).toBe(false);
    expect(isSlug('a'.repeat(61))).toBe(false);
  });

  it('refuses capitals, spaces and other characters', () => {
    expect(isSlug('Intro')).toBe(false);
    expect(isSlug('intro call')).toBe(false);
    expect(isSlug('intro_call')).toBe(false);
  });

  it('refuses a link part that starts with a dash', () => {
    expect(isSlug('-intro')).toBe(false);
  });

  it('describes the rule in words an editor can act on', () => {
    expect(SLUG_RULE).toContain('3–60');
  });
});
