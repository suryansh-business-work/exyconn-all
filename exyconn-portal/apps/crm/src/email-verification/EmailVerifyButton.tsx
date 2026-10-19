import { useState } from 'react';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import { useT } from '@exyconn/i18n';
import { Box, CircularProgress, Flex, IconButton, Tooltip } from '@exyconn/shell/components/ui';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import type { EmailVerificationBadgeFragment } from '@exyconn/shell/graphql/generated';
import { EmailStatusBadge } from './EmailStatusBadge';
import { useVerifyEmail } from './useVerifyEmail';

/**
 * Results already fetched in this tab, by address: opening the same contact again, or the
 * company that shares the address, shows the answer without checking it a second time.
 */
const checkedThisSession = new Map<string, EmailVerificationBadgeFragment>();

/**
 * A Verify button beside one address on a record's page. The latest result — stored, or made
 * here — shows next to it as the same chip the lists use, with the reason, time and who checked
 * in its tooltip; the button checks again.
 */
export function EmailVerifyButton({
  email,
  verification = null,
}: Readonly<{
  email: string;
  /** The stored check of the address, from the record; a check made here replaces it. */
  verification?: EmailVerificationBadgeFragment | null;
}>) {
  const t = useT();
  const verify = useVerifyEmail();
  const address = email.trim().toLowerCase();
  const [checkedHere, setCheckedHere] = useState(() => checkedThisSession.get(address) ?? null);
  const [checking, setChecking] = useState(false);
  const result = checkedHere ?? verification;

  const check = async () => {
    setChecking(true);
    try {
      const fresh = await verify(address);
      if (fresh) {
        checkedThisSession.set(address, fresh);
        setCheckedHere(fresh);
      }
    } finally {
      setChecking(false);
    }
  };

  const action = result ? t('Check {email} again', { email }) : t('Verify {email}', { email });
  return (
    <Flex direction="row" spacing={0.5} alignItems="center" aria-live="polite">
      {result && <EmailStatusBadge verification={result} />}
      <Tooltip title={action}>
        <Box component="span" sx={{ display: 'inline-flex' }}>
          <IconButton
            size="small"
            aria-label={action}
            disabled={checking}
            onClick={() => {
              check().catch((error: unknown) =>
                portalLogger.error('Verifying a CRM email failed', error),
              );
            }}
            data-cy="verify-email"
          >
            {checking ? (
              <CircularProgress size={16} aria-label={t('Checking…')} />
            ) : (
              <VerifiedUserOutlinedIcon fontSize="small" />
            )}
          </IconButton>
        </Box>
      </Tooltip>
    </Flex>
  );
}
