import { ItAccessKind } from '@exyconn/shell/graphql/generated';
import { AccessPage } from './AccessPage';

/**
 * IT › Password Resets. The reset itself happens in the system concerned or in the company's
 * secrets manager; this records that it was asked for, approved and done. No password is ever
 * typed into or stored by the portal.
 */
export function PasswordResetsPage() {
  return (
    <AccessPage
      onlyKind={ItAccessKind.PasswordReset}
      title="Password Resets"
      subtitle="Reset requests, approved and carried out. Passwords are never stored here."
      entityLabel="password reset"
    />
  );
}
