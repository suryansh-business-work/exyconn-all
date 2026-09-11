import { capabilities } from '../../tracker/platform';
import { Notice } from '../ui/Notice';

/**
 * iPhone only: what this phone can and cannot record, said before anything else on the
 * dashboard. Apple lets no app see the screen, other apps or input elsewhere, and suspends it
 * off screen — so an employee who assumed it tracked like their laptop would lose the hours.
 */
export function CapabilityNotice() {
  if (capabilities.background) {
    return null;
  }
  return (
    <Notice
      severity="info"
      icon="cellphone-information"
      detail="Apple lets no app see screenshots, other apps, or your typing and taps, and it stops apps that are not on screen. Keep the tracker open while you work, and claim anything else as off-computer time."
    >
      iPhone records your time only while the tracker is open.
    </Notice>
  );
}
