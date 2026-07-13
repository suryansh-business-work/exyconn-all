import { mjmlShell, ctaButton } from './layout.template';

export interface TrackerAccessEmailData {
  name: string;
  downloadUrl: string;
}

/**
 * Tells an employee they now have access to the desktop tracker.
 *
 * The email states plainly what the app records — that disclosure is the point, not
 * boilerplate: monitoring is only legitimate when the person being monitored knows about
 * it, and the app repeats the same list on its consent screen before anything is captured.
 */
export function trackerAccessTemplate(data: TrackerAccessEmailData): string {
  const { name, downloadUrl } = data;
  const body = `
    <mj-text font-size="15px" color="#334155" line-height="24px">Hi ${name},</mj-text>
    <mj-text font-size="15px" color="#334155" line-height="24px">
      You now have access to the <strong>Exyconn Tracker</strong> desktop app. Install it,
      sign in with your usual portal email and password, and press <strong>Start</strong> to
      begin tracking your work.
    </mj-text>
    <mj-divider border-color="#e2e8f0" />
    <mj-text font-size="14px" font-weight="600" color="#0b0a12" padding-bottom="4px">
      What the app records while tracking is ON
    </mj-text>
    <mj-text font-size="14px" color="#334155" line-height="22px" padding-top="0">
      • Time worked, and whether you were active or idle<br />
      • The <em>number</em> of key presses and mouse clicks — never which keys you pressed,
        and never what you type<br />
      • Which application and window is in the foreground, and for how long<br />
      • Periodic screenshots of your screen
    </mj-text>
    <mj-text font-size="14px" color="#334155" line-height="22px">
      Nothing is recorded when tracking is off. You can pause or stop at any time from the
      tracker's menu-bar icon, and you can review everything that was recorded about you —
      including your own screenshots — from <strong>My Tracker</strong> in the portal.
    </mj-text>
    ${ctaButton('Download the tracker', downloadUrl)}
    <mj-text font-size="13px" color="#94a3b8" align="center">
      You will be asked to accept these terms inside the app before any tracking begins.
    </mj-text>`;
  return mjmlShell('Start tracking your work', body);
}
