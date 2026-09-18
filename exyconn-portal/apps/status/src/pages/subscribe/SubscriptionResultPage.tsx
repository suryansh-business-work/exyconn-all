import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import {
  Alert,
  Box,
  CircularProgress,
  Flex,
  Typography,
  fontWeight,
} from '@exyconn/shell/components/ui';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';

interface SubscriptionResultPageProps {
  title: string;
  /** Runs the confirm or unsubscribe mutation with the token from the query string. */
  action: (token: string) => Promise<unknown>;
  successMessage: string;
  /** Shown when the URL carries no token at all — usually a truncated email link. */
  missingTokenMessage: string;
}

/**
 * The one line somebody sees after following a link from a status email.
 *
 * Both links do their work on arrival rather than behind a button: the click in the email
 * was the confirmation, and asking for a second one only loses people.
 */
export function SubscriptionResultPage({
  title,
  action,
  successMessage,
  missingTokenMessage,
}: Readonly<SubscriptionResultPageProps>) {
  // Titles and outcomes arrive as English props from the two pages that use this frame,
  // so they are translated here rather than at each call site.
  const t = useT();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setError(t(missingTokenMessage));
      return;
    }
    action(token)
      .then(() => setDone(true))
      .catch((cause: unknown) => setError(errorMessage(cause, t('That link could not be used.'))));
  }, [token, action, missingTokenMessage, t]);

  return (
    <Flex direction="column" spacing={2}>
      <Box>
        <Typography
          variant="h5"
          sx={{
            fontWeight: fontWeight.bold,
          }}
        >
          {t(title)}
        </Typography>
      </Box>
      {!done && !error && (
        <Flex direction="row" spacing={1} alignItems="center">
          <CircularProgress size={18} />
          <Typography variant="body2">{t('Just a moment…')}</Typography>
        </Flex>
      )}
      {done && <Alert severity="success">{t(successMessage)}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}
    </Flex>
  );
}
