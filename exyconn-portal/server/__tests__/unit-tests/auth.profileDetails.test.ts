import {
  BRIEF_MAX_LENGTH,
  SOCIAL_NETWORKS,
  profileDetailsUpdate,
  type SocialLinksInput,
} from '../../src/modules/auth/profile-details';

type Network = (typeof SOCIAL_NETWORKS)[number];
const BAD_LINKS: Array<[Network, string]> = [
  ['website', 'ftp://files.example.com'],
  ['linkedin', 'linkedin.com/in/asha'],
];

describe('profileDetailsUpdate', () => {
  it('returns only the fields that were sent', () => {
    expect(profileDetailsUpdate({})).toEqual({});
    expect(profileDetailsUpdate({ phone: '+1 (415) 555-0100' })).toEqual({
      phone: '+1 (415) 555-0100',
    });
  });

  it('accepts a bio at the limit and refuses one past it', () => {
    const atLimit = 'b'.repeat(BRIEF_MAX_LENGTH);

    expect(profileDetailsUpdate({ brief: atLimit })).toEqual({ brief: atLimit });
    expect(() => profileDetailsUpdate({ brief: `${atLimit}b` })).toThrow(
      `The bio can be at most ${BRIEF_MAX_LENGTH} characters.`,
    );
  });

  it('clears a bio or phone that is only whitespace', () => {
    expect(profileDetailsUpdate({ brief: '   ', phone: '  ' })).toEqual({
      brief: null,
      phone: null,
    });
  });

  it.each(['1234567', '+'.concat('1'.repeat(20)), '(022) 2345-6789'])(
    'accepts the phone number %p',
    (phone) => {
      expect(profileDetailsUpdate({ phone }).phone).toBe(phone);
    },
  );

  it.each(['123456', '1'.repeat(21), '555-CALL-NOW', '+44 20 7946 0958 ext 2'])(
    'refuses the phone number %p',
    (phone) => {
      expect(() => profileDetailsUpdate({ phone })).toThrow(
        'Enter a phone number with 7 to 20 digits.',
      );
    },
  );

  it('fills every network, clearing the ones not given', () => {
    const { socialLinks } = profileDetailsUpdate({
      socialLinks: { twitter: ' http://twitter.com/asha ', linkedin: null },
    });

    expect(Object.keys(socialLinks as object)).toEqual([...SOCIAL_NETWORKS]);
    expect(socialLinks).toEqual({
      linkedin: null,
      github: null,
      twitter: 'http://twitter.com/asha',
      website: null,
    });
  });

  it.each(BAD_LINKS)('refuses a %s link that is not a web address', (network, link) => {
    const socialLinks: SocialLinksInput = {};
    socialLinks[network] = link;
    expect(() => profileDetailsUpdate({ socialLinks })).toThrow(
      `The ${network} link must be a full address starting with https://`,
    );
  });
});
