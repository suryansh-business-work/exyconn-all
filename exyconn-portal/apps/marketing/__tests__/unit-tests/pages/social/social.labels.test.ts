import { describe, expect, it } from 'vitest';
import { SocialNetwork } from '@exyconn/shell/graphql/generated';
import {
  NETWORK_LABEL,
  SOCIAL_PATH,
  UNSENT,
  accountLabel,
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

  it('treats only posts that have not gone out as unsent', () => {
    expect(['DRAFT', 'SCHEDULED', 'FAILED'].every((status) => UNSENT.has(status))).toBe(true);
    expect(UNSENT.has('PUBLISHED')).toBe(false);
    expect(UNSENT.has('PUBLISHING')).toBe(false);
  });

  it('keeps the section under the marketing portal', () => {
    expect(SOCIAL_PATH).toBe('/marketing/social');
  });
});
