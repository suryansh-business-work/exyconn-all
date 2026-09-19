import { describe, expect, it } from 'vitest';
import {
  makeSocialPostSchema,
  postLength,
  toFormValues,
} from '../../src/pages/social/forms/social-post';
import type { NetworkRule, SocialMediaPostRow } from '../../src/pages/social/forms/social-post';

const rule = (network: string, over: Partial<NetworkRule> = {}): NetworkRule =>
  ({
    __typename: 'SocialNetworkRule',
    network,
    canPublish: true,
    maxChars: 280,
    requiresImage: false,
    allowsImage: true,
    note: '',
    ...over,
  }) as NetworkRule;

const RULES: Record<string, NetworkRule> = {
  x: rule('X', { allowsImage: false }),
  ig: rule('INSTAGRAM', { maxChars: 2200, requiresImage: true }),
  fb: rule('FACEBOOK', { maxChars: 63_206 }),
};
const schema = makeSocialPostSchema((id) => RULES[id]);
const base = {
  accountIds: ['fb'],
  text: 'Hello',
  mediaUrl: '',
  link: '',
  timing: 'NOW' as const,
  scheduledAt: '',
};
const errorsOf = (values: object) => {
  const result = schema.safeParse(values);
  return result.success
    ? []
    : result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
};

describe('social post schema', () => {
  it('accepts a plain post to Facebook', () => {
    expect(errorsOf(base)).toEqual([]);
  });

  it('asks for an account and for something to post', () => {
    expect(errorsOf({ ...base, accountIds: [], text: ' ' })).toEqual([
      'accountIds: Choose at least one account',
      'text: Write something, or add an image',
    ]);
  });

  it("applies every chosen network's own limits", () => {
    expect(errorsOf({ ...base, accountIds: ['ig'] })).toEqual([
      'mediaUrl: INSTAGRAM needs an image',
    ]);
    expect(errorsOf({ ...base, accountIds: ['x'], mediaUrl: 'https://i/a.png' })).toEqual([
      'mediaUrl: X posts from here cannot carry an image',
    ]);
    expect(errorsOf({ ...base, accountIds: ['x', 'fb'], text: 'x'.repeat(281) })).toEqual([
      'text: X allows 280 characters; this is 281',
    ]);
    expect(errorsOf({ ...base, accountIds: ['unknown'] })).toEqual([]);
  });

  it('counts the link where the network appends it, and wants a full link', () => {
    expect(postLength('Hi', 'https://exyconn.com')).toBe(2 + 2 + 19);
    expect(postLength('See https://exyconn.com', 'https://exyconn.com')).toBe(23);
    expect(errorsOf({ ...base, link: 'exyconn.com' })).toEqual([
      'link: Enter a full link, starting with https://',
    ]);
  });

  it('needs a future time to schedule', () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    const future = new Date(Date.now() + 60 * 60_000).toISOString();
    expect(errorsOf({ ...base, timing: 'SCHEDULE', scheduledAt: past })).toEqual([
      'scheduledAt: Pick a time in the future',
    ]);
    expect(errorsOf({ ...base, timing: 'SCHEDULE', scheduledAt: '' })).toEqual([
      'scheduledAt: Pick a time in the future',
    ]);
    expect(errorsOf({ ...base, timing: 'SCHEDULE', scheduledAt: future })).toEqual([]);
  });

  it('starts a new post empty, and an edit from the stored post', () => {
    expect(toFormValues(null)).toMatchObject({ accountIds: [], timing: 'NOW' });
    const stored = {
      accountId: 'x',
      text: 'T',
      mediaUrl: '',
      link: '',
      status: 'SCHEDULED',
      scheduledAt: '2026-10-01T10:00:00Z',
    } as SocialMediaPostRow;
    expect(toFormValues(stored)).toMatchObject({ accountIds: ['x'], timing: 'SCHEDULE' });
    expect(toFormValues({ ...stored, status: 'DRAFT' } as SocialMediaPostRow).timing).toBe('DRAFT');
  });
});
