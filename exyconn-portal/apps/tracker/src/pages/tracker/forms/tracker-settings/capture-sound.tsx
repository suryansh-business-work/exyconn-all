import { useFormContext } from 'react-hook-form';
import { useT } from '@exyconn/i18n';
import { Box, FormHelperText } from '@exyconn/shell/components/ui';
import { RhfSwitch } from '@exyconn/shell/components/form/rhf';

/**
 * Whether a capture is announced out loud on the employee's own machine.
 *
 * On by default, and it should stay on: photographing somebody's screen in silence is what
 * turns monitoring into surveillance. This exists for the rooms where the shutter is genuinely
 * disruptive — a shared desk, a call centre, a floor of trackers all firing at once — never as
 * a way to capture unnoticed, which is why the notification still appears when it is off.
 * Employees can also mute it on their own machine without an admin muting it for everybody.
 */
export function CaptureSoundFields() {
  const t = useT();
  const { watch } = useFormContext<{ captureSoundEnabled: boolean }>();
  const enabled = watch('captureSoundEnabled');
  const hint = enabled
    ? t('The desktop app plays a camera shutter and its capture notification makes a sound.')
    : t(
        'Captures are silent on every device. The notification still appears, so nobody is screenshotted without being told.',
      );

  return (
    <Box>
      <RhfSwitch name="captureSoundEnabled" label="Play a sound with each screenshot" />
      <FormHelperText>{hint}</FormHelperText>
    </Box>
  );
}
