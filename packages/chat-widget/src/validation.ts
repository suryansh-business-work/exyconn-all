import { strings } from './strings';
import type { Identity } from './types';

/*
 * The same checks the server makes in website-chat/chat.validation.ts, run first so the visitor
 * hears about a typo without a round trip. This package has no dependencies, so the patterns are
 * copied: PHONE is @exyconn/regex's PHONE, EMAIL is the server's utils/emailAddress pattern.
 */
const PHONE = /^\+?\(?\d[\d\s()-]{5,18}\d$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_EMAIL = 254;
const MAX_NAME = 120;
/** No link or address in a name: it is printed in an email to the address given. */
const LINK_LIKE = /[@/]|www\.|\.(?:com|net|org|io|ru|xyz)\b/i;
const CODE = /^\d{6}$/;

export type IdentityErrors = Partial<Record<keyof Identity, string>>;

function nameError(name: string): string | undefined {
  if (name === '') {
    return strings.nameRequired;
  }
  if (name.length > MAX_NAME) {
    return strings.nameTooLong;
  }
  return LINK_LIKE.test(name) ? strings.nameLink : undefined;
}

/** Problems with the details, by field; empty when they can be sent. */
export function validateIdentity(identity: Readonly<Identity>): IdentityErrors {
  const errors: IdentityErrors = {};
  const name = nameError(identity.name);
  if (name) {
    errors.name = name;
  }
  if (identity.email.length > MAX_EMAIL || !EMAIL.test(identity.email)) {
    errors.email = strings.emailInvalid;
  }
  if (identity.phone !== '' && !PHONE.test(identity.phone)) {
    errors.phone = strings.phoneInvalid;
  }
  return errors;
}

export function isValidCode(code: string): boolean {
  return CODE.test(code);
}
