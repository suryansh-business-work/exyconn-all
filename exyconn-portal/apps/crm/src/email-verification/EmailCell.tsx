import { useState } from 'react';
import type { ICellRendererParams } from 'ag-grid-community';
import { Flex, Text } from '@exyconn/shell/components/ui';
import type { EmailVerificationBadgeFragment } from '@exyconn/shell/graphql/generated';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { EmailStatusBadge } from './EmailStatusBadge';

/** A row with an email and, when it has been checked, the latest result. */
export interface EmailRow {
  email: string;
  emailVerification?: EmailVerificationBadgeFragment | null;
}

/** The grid context a page gives an email column: how to check one row's address now. */
export interface EmailCheckContext {
  verifyEmail: (email: string) => Promise<void>;
}

/** The address with its verification badge; an unchecked one can be checked from the cell. */
export function EmailCell(params: Readonly<ICellRendererParams<EmailRow>>) {
  const [checking, setChecking] = useState(false);
  const row = params.data;
  if (!row?.email) {
    return null;
  }
  const { verifyEmail } = params.context as EmailCheckContext;
  const check = () => {
    setChecking(true);
    verifyEmail(row.email)
      .catch((error: unknown) =>
        portalLogger.warn('crm: checking an email from the grid failed', error),
      )
      .finally(() => setChecking(false));
  };
  return (
    <Flex alignItems="center" gap={1} sx={{ height: '100%', minWidth: 0 }}>
      <Text noWrap sx={{ minWidth: 0 }}>
        {row.email}
      </Text>
      <EmailStatusBadge verification={row.emailVerification} onCheck={check} checking={checking} />
    </Flex>
  );
}
