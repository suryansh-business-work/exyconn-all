import { useState } from 'react';
import { DISCLOSURE_ITEMS } from '@shared/config';

/**
 * Consent gate. Discloses exactly what is recorded (verbatim from shared config)
 * and only proceeds once the person explicitly agrees. This is what makes the
 * monitoring consensual, so the copy is plain and honest.
 */
export default function ConsentScreen(): JSX.Element {
  const [busy, setBusy] = useState(false);

  async function accept(): Promise<void> {
    setBusy(true);
    try {
      await window.tracker.acceptConsent();
    } catch (cause: unknown) {
      console.error('Failed to record consent', cause);
      setBusy(false);
    }
  }

  async function decline(): Promise<void> {
    setBusy(true);
    try {
      await window.tracker.logout();
    } catch (cause: unknown) {
      console.error('Failed to sign out', cause);
      setBusy(false);
    }
  }

  return (
    <div className="app screen screen--scroll">
      <header className="brand">
        <span className="brand__dot" />
        <h1 className="brand__title">Exyconn Tracker</h1>
      </header>

      <div className="card">
        <h2 className="card__heading">Before you start</h2>
        <p className="body">
          While tracking is on, this app records the following and syncs it to your Exyconn
          workspace:
        </p>

        <ul className="disclosure">
          {DISCLOSURE_ITEMS.map((item) => (
            <li key={item} className="disclosure__item">
              {item}
            </li>
          ))}
        </ul>

        <div className="notes">
          <p className="body">
            <strong>Keystrokes and clicks are counted, not recorded.</strong> The app stores how
            many times you typed or clicked — never which keys and never the text you enter.
          </p>
          <p className="body">
            Nothing is captured while tracking is stopped or paused. You can pause or stop at any
            time, from this window or the tray icon.
          </p>
          <p className="body">
            You can review everything collected about you, whenever you like, in the Exyconn portal.
          </p>
        </div>

        <button className="btn btn--primary" type="button" onClick={accept} disabled={busy}>
          I understand and agree
        </button>
        <button className="btn btn--ghost" type="button" onClick={decline} disabled={busy}>
          Not now
        </button>
      </div>
    </div>
  );
}
