import { useT } from '@exyconn/i18n';
import { Box, Button, Text } from '@exyconn/shell/components/ui';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  GmailConfigDocument,
  useUseGoogleSignInClientForGmailMutation,
} from '@exyconn/shell/graphql/generated';

/**
 * One Google OAuth client can serve both Google sign-in and the CRM's Gmail. This copies the
 * client already saved for sign-in into Gmail and turns Gmail on, so it is not typed twice.
 */
export function UseGoogleClientButton() {
  const t = useT();
  const notify = useNotify();
  const [copy, { loading }] = useUseGoogleSignInClientForGmailMutation({
    refetchQueries: [GmailConfigDocument],
  });
  const run = async () => {
    try {
      await copy();
      notify('Gmail now uses the Google sign-in client', 'success');
    } catch (error) {
      notify(errorMessage(error, 'The Google sign-in client could not be used'), 'error');
    }
  };
  return (
    <Box sx={{ mb: 2 }}>
      <Button variant="outlined" onClick={run} loading={loading}>
        {t('Use the Google sign-in client')}
      </Button>
      <Text size="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
        {t(
          'Copies the client ID and secret saved under Google sign-in and turns Gmail on. Add the redirect URI below to that same client.',
        )}
      </Text>
    </Box>
  );
}
