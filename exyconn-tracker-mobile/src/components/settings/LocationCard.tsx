import { XStack } from 'tamagui';
import { useT } from '@exyconn/i18n';
import {
  LOCATION_PURPOSE,
  locationStatusLabel,
  locationStatusSentence,
  locationTurnOn,
  type LocationAccess,
} from '@exyconn/tracker-core';
import { useLocationAccess } from '../../hooks/useLocationAccess';
import { run } from '../../tracker/run';
import type { ThemeColor } from '../../theme/useThemeColor';
import { OpenLocationSettingsButton } from '../location/OpenLocationSettingsButton';
import { AppButton } from '../ui/AppButton';
import { Chip } from '../ui/Chip';
import { Body } from '../ui/Typography';
import { SettingsCard } from './SettingsCard';

const CHIP_TONES: Readonly<Record<LocationAccess['status'], ThemeColor>> = {
  checking: 'muted',
  on: 'success',
  off: 'warning',
};

/**
 * Location access on this phone: why the tracker needs it, whether it is on (and if not, why),
 * and the way to turn it on — the same words and actions as the desktop's location card.
 */
export function LocationCard() {
  const t = useT();
  const { access, turnOn } = useLocationAccess();
  const canTurnOn = locationTurnOn(access) !== null;

  return (
    <SettingsCard title={t('Location')} description={t(LOCATION_PURPOSE)}>
      <XStack gap="$2" alignItems="center">
        <Chip label={locationStatusLabel(access, t)} tone={CHIP_TONES[access.status]} />
        <Body flex={1} accessibilityLiveRegion="polite">
          {locationStatusSentence(access, t)}
        </Body>
      </XStack>
      {canTurnOn ? (
        <AppButton label={t('Turn on')} icon="crosshairs-gps" full onPress={() => run(turnOn)} />
      ) : null}
      <OpenLocationSettingsButton />
    </SettingsCard>
  );
}
