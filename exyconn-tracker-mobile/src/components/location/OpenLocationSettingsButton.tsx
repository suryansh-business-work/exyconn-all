import { useT } from '@exyconn/i18n';
import { openLocationSettings } from '../../tracker/location-access';
import { run } from '../../tracker/run';
import { AppButton, type ButtonTone } from '../ui/AppButton';

interface Props {
  tone?: ButtonTone;
}

/**
 * Opens where location is switched on. Used by the settings location card and by
 * attendance's location fallback sheet, as on the desktop.
 */
export function OpenLocationSettingsButton({ tone = 'outlined' }: Readonly<Props>) {
  const t = useT();
  return (
    <AppButton
      label={t('Open location settings')}
      icon="open-in-new"
      tone={tone}
      full
      onPress={() => run(openLocationSettings)}
    />
  );
}
