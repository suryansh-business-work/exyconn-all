import { badRequest } from '../../utils/errors';

/** Matches the HR form's limit on the same field, so neither side accepts what the other refuses. */
export const BRIEF_MAX_LENGTH = 600;
const PHONE_DIGITS_MIN = 7;
const PHONE_DIGITS_MAX = 20;
/** Digits with the separators people write a number with: + ( ) - and spaces. */
const PHONE_CHARACTERS = /^\+?[\d\s()-]+$/;

export const SOCIAL_NETWORKS = ['linkedin', 'github', 'twitter', 'website'] as const;
type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];
export type SocialLinksInput = Partial<Record<SocialNetwork, string | null>>;

export interface ProfileDetailsInput {
  brief?: string;
  phone?: string;
  socialLinks?: SocialLinksInput;
}

/** '' clears a field back to null; anything else is kept trimmed. */
function cleared(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function checkedPhone(value: string): string | null {
  const phone = cleared(value);
  if (phone === null) {
    return null;
  }
  const digits = phone.replaceAll(/\D/g, '').length;
  if (!PHONE_CHARACTERS.test(phone) || digits < PHONE_DIGITS_MIN || digits > PHONE_DIGITS_MAX) {
    badRequest('Enter a phone number with 7 to 20 digits.');
  }
  return phone;
}

function isWebAddress(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}

function checkedLinks(input: SocialLinksInput): Record<SocialNetwork, string | null> {
  const links = {} as Record<SocialNetwork, string | null>;
  for (const network of SOCIAL_NETWORKS) {
    const link = cleared(input[network] ?? '');
    if (link !== null && !isWebAddress(link)) {
      badRequest(`The ${network} link must be a full address starting with https://`);
    }
    links[network] = link;
  }
  return links;
}

/**
 * The part of a person's own profile edit that describes them to colleagues: bio, phone and
 * shared links. Returns only the fields that were sent, validated, ready for `$set`.
 */
export function profileDetailsUpdate(input: ProfileDetailsInput): Record<string, unknown> {
  const update: Record<string, unknown> = {};
  if (input.brief !== undefined) {
    const brief = cleared(input.brief);
    if (brief !== null && brief.length > BRIEF_MAX_LENGTH) {
      badRequest(`The bio can be at most ${BRIEF_MAX_LENGTH} characters.`);
    }
    update.brief = brief;
  }
  if (input.phone !== undefined) {
    update.phone = checkedPhone(input.phone);
  }
  if (input.socialLinks !== undefined) {
    update.socialLinks = checkedLinks(input.socialLinks);
  }
  return update;
}
