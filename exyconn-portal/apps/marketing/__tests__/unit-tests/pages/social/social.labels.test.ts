import { describe, expect, it } from 'vitest';
import { SocialAccountKind, SocialNetwork } from '@exyconn/shell/graphql/generated';
import {
  NETWORK_LABEL,
  SOCIAL_PATH,
  UNSENT,
  accountLabel,
  isPostable,
} from '../../../../src/pages/social/social.labels';

describe('social labels', () => {
  it('names every network the way people know it', () => {
    expect(Object.keys(NETWORK_LABEL).sort((a, b) => a.localeCompare(b))).toEqual(
      Object.values(SocialNetwork).sort((a, b) => a.localeCompare(b)),
    );
    expect(NETWORK_LABEL[SocialNetwork.Linkedin]).toBe('LinkedIn');
    expect(NETWORK_LABEL[SocialNetwork.Youtube]).toBe('YouTube');
  });

  it('labels an account by its name and its network', () => {
    expect(accountLabel({ name: 'Acme', network: SocialNetwork.Instagram })).toBe(
      'Acme · Instagram',
    );
  });

  it('labels a company page as the network page it is', () => {
    expect(
      accountLabel({
        name: 'Exyconn',
        network: SocialNetwork.Linkedin,
        kind: SocialAccountKind.Organization,
      }),
    ).toBe('Exyconn · LinkedIn page');
    expect(
      accountLabel({
        name: 'Asha',
        network: SocialNetwork.Linkedin,
        kind: SocialAccountKind.Person,
      }),
    ).toBe('Asha · LinkedIn');
  });

  it('posts only to accounts that are on and still reachable', () => {
    expect(isPostable({ active: true, disconnectedAt: null })).toBe(true);
    expect(isPostable({})).toBe(true);
    expect(isPostable({ active: false })).toBe(false);
    expect(isPostable({ active: true, disconnectedAt: '2026-10-01T00:00:00.000Z' })).toBe(false);
  });

  it('treats only posts that have not gone out as unsent', () => {
    expect(['DRAFT', 'SCHEDULED', 'FAILED'].every((status) => UNSENT.has(status))).toBe(true);
    expect(UNSENT.has('PUBLISHED')).toBe(false);
    expect(UNSENT.has('PUBLISHING')).toBe(false);
  });

  it('keeps the section under the marketing portal', () => {
    expect(SOCIAL_PATH).toBe('/marketing/social');
  });
});
