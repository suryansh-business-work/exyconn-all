import type { ReactElement } from 'react';
import { Button, type ButtonProps } from '@exyconn/ui';
import { useT } from '@exyconn/i18n';
import OpenInNewRounded from '@mui/icons-material/OpenInNewRounded';
import { run } from '../run';

type Props = Pick<ButtonProps, 'variant' | 'size' | 'color' | 'fullWidth'>;

/**
 * Opens the OS page where location access is switched on (main picks it per platform). Used
 * by the Settings location card and by attendance's location fallback dialog.
 */
export default function OpenLocationSettingsButton(props: Readonly<Props>): ReactElement {
  const t = useT();
  return (
    <Button
      {...props}
      startIcon={<OpenInNewRounded />}
      onClick={() => run(() => globalThis.tracker.openLocationSettings())}
    >
      {t('Open location settings')}
    </Button>
  );
}
