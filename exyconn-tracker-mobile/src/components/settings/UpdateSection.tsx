import * as Application from 'expo-application';
import { Platform } from 'react-native';
import { YStack } from 'tamagui';
import { useUpdateState } from '../../hooks/useUpdateState';
import { installNote, updateStatus } from '../../lib/settings/update-status';
import { run } from '../../tracker/run';
import { checkForUpdate, openUpdate } from '../../tracker/updates';
import { AppButton } from '../ui/AppButton';
import { Body, Caption } from '../ui/Typography';

const IS_ANDROID = Platform.OS === 'android';

/**
 * Updates, phone-shaped. Checking NOW is a question ("is mine current?") that an app which only
 * looks every six hours could not answer, so it gets a button and a visible answer. There is no
 * "update automatically" switch: a phone never installs itself — Android's installer asks first,
 * and an iPhone build comes from the administrator — so the new build is only ever offered.
 */
export function UpdateSection() {
  const update = useUpdateState();
  const version = Application.nativeApplicationVersion ?? '—';
  const checking = update.stage === 'checking';
  const openLabel = IS_ANDROID ? 'Download' : 'Details';

  return (
    <YStack gap="$2">
      <Body fontWeight="600">Updates</Body>
      <Caption>This phone runs version {version}.</Caption>
      <AppButton
        label="Check for updates"
        tone="outlined"
        icon="refresh"
        full
        busy={checking}
        onPress={() => run(checkForUpdate)}
      />
      <Caption accessibilityLiveRegion="polite">{updateStatus(update, Date.now())}</Caption>
      {update.stage === 'available' ? (
        <AppButton
          label={openLabel}
          icon={IS_ANDROID ? 'download' : 'open-in-new'}
          full
          accessibilityLabel={`${openLabel} version ${update.version}`}
          onPress={() => run(openUpdate)}
        />
      ) : null}
      <Caption>{installNote(IS_ANDROID)}</Caption>
    </YStack>
  );
}
