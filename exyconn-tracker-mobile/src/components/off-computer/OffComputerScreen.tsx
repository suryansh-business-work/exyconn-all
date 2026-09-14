import { useRef, useState } from 'react';
import type { HostInstance } from 'react-native';
import { Spinner, XStack, YStack } from 'tamagui';
import { useT } from '@exyconn/i18n';
import type { ManualEntry, TrackerProject } from '@exyconn/tracker-core';
import { ManualEntryForm } from '../../forms/manual-entry';
import { useManualEntries } from '../../hooks/useManualEntries';
import { AppButton } from '../ui/AppButton';
import { Notice } from '../ui/Notice';
import { ScreenLayout } from '../ui/ScreenLayout';
import { Surface } from '../ui/Surface';
import { Caption, Title } from '../ui/Typography';
import { ManualEntryList } from './ManualEntryList';
import { WithdrawDialog } from './WithdrawDialog';

interface Props {
  projects: readonly TrackerProject[];
  /** The employee's chosen zone — every window below is read in it. */
  timezone: string;
}

interface ClaimProps extends Props {
  onCancel: () => void;
  onDone: () => void;
}

/** The claim form, in place of the list while it is being filled in. */
function ClaimView({ projects, timezone, onCancel, onDone }: Readonly<ClaimProps>) {
  const t = useT();
  return (
    <ScreenLayout>
      <Title>{t('Claim off-computer time')}</Title>
      <Surface>
        <ManualEntryForm
          projects={projects}
          timezone={timezone}
          onCancel={onCancel}
          onDone={onDone}
        />
      </Surface>
    </ScreenLayout>
  );
}

/**
 * Work done away from the phone: a client meeting, a site visit, a call from the car.
 *
 * It used to be claimable only from the portal, which meant opening a browser to record time
 * the app was sitting right there for. Claiming and taking one back both happen here now; the
 * decision still belongs to a manager, in the portal's review queue.
 */
export function OffComputerScreen({ projects, timezone }: Readonly<Props>) {
  const t = useT();
  const { entries, loading, error, reload } = useManualEntries();
  const [claiming, setClaiming] = useState(false);
  const [withdrawing, setWithdrawing] = useState<ManualEntry | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const withdrawOpener = useRef<HostInstance>(null);

  if (claiming) {
    return (
      <ClaimView
        projects={projects}
        timezone={timezone}
        onCancel={() => setClaiming(false)}
        onDone={() => {
          setClaiming(false);
          reload();
        }}
      />
    );
  }

  const showSpinner = loading && entries.length === 0;

  return (
    <ScreenLayout onRefresh={reload} refreshing={loading && entries.length > 0}>
      <XStack justifyContent="space-between" alignItems="center" gap="$3">
        <Caption flex={1}>
          {t('Hours the tracker could not measure, and where each one stands.')}
        </Caption>
        <AppButton
          label={t('Claim time')}
          icon="plus"
          onPress={() => {
            setWithdrawError(null);
            setClaiming(true);
          }}
        />
      </XStack>

      {error === null ? null : <Notice severity="error">{error}</Notice>}
      {withdrawError === null ? null : <Notice severity="error">{withdrawError}</Notice>}

      {showSpinner ? (
        <YStack alignItems="center" paddingVertical="$4">
          <Spinner accessibilityLabel={t('Loading your claims')} />
        </YStack>
      ) : (
        <ManualEntryList
          entries={entries}
          timezone={timezone}
          onWithdraw={(entry, opener) => {
            withdrawOpener.current = opener;
            setWithdrawError(null);
            setWithdrawing(entry);
          }}
        />
      )}

      <WithdrawDialog
        entry={withdrawing}
        timezone={timezone}
        onClose={() => setWithdrawing(null)}
        onWithdrawn={reload}
        onFailed={setWithdrawError}
        returnFocusTo={withdrawOpener}
      />
    </ScreenLayout>
  );
}
