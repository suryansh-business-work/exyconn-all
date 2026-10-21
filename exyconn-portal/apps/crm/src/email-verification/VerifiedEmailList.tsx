import type { EmailVerificationBadgeFragment } from '@exyconn/shell/graphql/generated';
import { ContactPointList } from '../records/detail/ContactPointList';
import { EmailVerifyButton } from './EmailVerifyButton';

/** One address of a record, with its stored check when the query asked for it. */
export interface CheckedEmail {
  address: string;
  label: string;
  primary: boolean;
  verification?: EmailVerificationBadgeFragment | null;
}

/**
 * A record's addresses, each a mail link with its latest check (a Verified chip for a good
 * mailbox, the other statuses as elsewhere) and a button to check it again.
 */
export function VerifiedEmailList({ emails }: Readonly<{ emails: readonly CheckedEmail[] }>) {
  const checks = new Map(emails.map((email) => [email.address, email.verification ?? null]));
  return (
    <ContactPointList
      scheme="mailto"
      points={emails.map((email) => ({ ...email, value: email.address }))}
      renderTrailing={(address) => (
        <EmailVerifyButton email={address} verification={checks.get(address) ?? null} />
      )}
    />
  );
}
