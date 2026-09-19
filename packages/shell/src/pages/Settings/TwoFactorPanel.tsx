import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import { Alert, Box, Button, Chip, Flex, Heading, Text } from '@/components/ui';
import { readingPanel } from '@/components/glass/glass';
import { errorMessage } from '@/utils/errorMessage';
import { useMyMfaStatusQuery } from '@/graphql/generated';
import { TwoFactorForm, DisableTwoFactorForm } from './forms/two-factor';

interface RecoveryCodesProps {
  codes: readonly string[];
  onDone: () => void;
}

/**
 * The one and only sighting of the recovery codes.
 *
 * They are stored hashed, so this screen cannot be reproduced — which is the point, and why
 * it says so plainly rather than offering a "show again" nobody could honour.
 */
function RecoveryCodes({ codes, onDone }: Readonly<RecoveryCodesProps>) {
  const t = useT();
  return (
    <Box>
      <Alert severity="warning" sx={{ mb: 1 }}>
        {t('Save these now. They are shown once and cannot be shown again.')}
      </Alert>
      <Box
        component="ul"
        sx={{ m: 0, mb: 1, pl: 2.5, columns: 2, fontFamily: 'monospace', fontSize: 14 }}
      >
        {codes.map((code) => (
          <li key={code}>{code}</li>
        ))}
      </Box>
      <Button variant="contained" onClick={onDone}>
        {t('I have saved them')}
      </Button>
    </Box>
  );
}

/** Which of the panel's four states is on screen. */
type Stage = 'idle' | 'enrolling' | 'codes' | 'disabling';

/**
 * Account settings: two-factor authentication.
 *
 * A password alone has been the whole of this portal's security since it was built, on
 * accounts that reach payroll, contracts and the compliance registers.
 */
export function TwoFactorPanel() {
  const t = useT();
  const { data, loading, error, refetch } = useMyMfaStatusQuery({
    fetchPolicy: 'cache-and-network',
  });
  const [stage, setStage] = useState<Stage>('idle');
  const [codes, setCodes] = useState<string[]>([]);
  const status = data?.myMfaStatus;

  const finish = async () => {
    setStage('idle');
    setCodes([]);
    await refetch();
  };

  const body = () => {
    if (stage === 'enrolling') {
      return (
        <TwoFactorForm
          onEnrolled={(recoveryCodes) => {
            setCodes(recoveryCodes);
            setStage('codes');
          }}
          onCancel={() => setStage('idle')}
        />
      );
    }
    if (stage === 'codes') {
      return <RecoveryCodes codes={codes} onDone={finish} />;
    }
    if (stage === 'disabling') {
      return <DisableTwoFactorForm onDisabled={finish} onCancel={() => setStage('idle')} />;
    }
    if (status?.enabled) {
      return (
        <Flex direction="column" spacing={1} sx={{ alignItems: 'flex-start' }}>
          <Text size="sm" color="text.secondary">
            {t('{count} recovery codes left.', { count: status.recoveryCodesLeft })}
          </Text>
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={() => setStage('disabling')}
          >
            {t('Turn off')}
          </Button>
        </Flex>
      );
    }
    return (
      <Button variant="contained" onClick={() => setStage('enrolling')} disabled={loading}>
        {t('Set up two-factor authentication')}
      </Button>
    );
  };

  return (
    <Box sx={readingPanel}>
      <Flex direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
        <Heading level={6}>{t('Two-factor authentication')}</Heading>
        {status && (
          <Chip
            size="small"
            label={status.enabled ? t('On') : t('Off')}
            color={status.enabled ? 'success' : 'default'}
            variant="outlined"
          />
        )}
      </Flex>
      <Text size="sm" color="text.secondary" sx={{ mb: 1.5 }}>
        {t('Ask for a code from your phone as well as your password when you sign in.')}
      </Text>
      {error && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {errorMessage(error, t('Two-factor status unavailable.'))}
        </Alert>
      )}
      {body()}
    </Box>
  );
}
