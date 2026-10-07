// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import type { LiveStats, TrackerSettings } from '@shared/types';
import SyncBar from '../../../../src/renderer/components/SyncBar';
import { LiveAnnouncer } from '../../../../src/renderer/a11y/LiveAnnouncer';
import { render, trackerState, unmountAll } from '../../test-utils';
import { pageText } from './fixtures';

afterEach(unmountAll);

const state = trackerState('tracking');

function stats(overrides: Partial<LiveStats>): LiveStats {
  return { ...state.stats, lastSyncAt: null, lastSyncOutcome: null, ...overrides };
}

function settings(syncIntervalMinutes: number): TrackerSettings | null {
  return state.settings === null ? null : { ...state.settings, syncIntervalMinutes };
}

function alert(): Element | null {
  return document.querySelector('.MuiAlert-root');
}

describe('SyncBar', () => {
  it('says everything is uploaded, and on what cadence', async () => {
    await render(
      <SyncBar
        stats={stats({ pendingSync: 0, syncing: false })}
        settings={settings(5)}
        timezone="UTC"
      />,
    );
    expect(pageText()).toContain('Everything uploaded');
    expect(pageText()).toContain('Last synced Never · Uploads automatically every 5 minutes');
    expect(alert()).toBeNull();
  });

  it('counts what is still queued, with the one-minute cadence in the singular', async () => {
    await render(
      <SyncBar
        stats={stats({ pendingSync: 1204, syncing: false })}
        settings={settings(1)}
        timezone="UTC"
      />,
    );
    expect(pageText()).toContain('1,204 waiting to upload');
    expect(pageText()).toContain('Uploads automatically every 1 minute');
  });

  it('shows an upload in flight, and holds the last outcome until it lands', async () => {
    await render(
      <SyncBar
        stats={stats({
          pendingSync: 3,
          syncing: true,
          lastSyncOutcome: { kind: 'uploaded', count: 2, discarded: 0 },
        })}
        settings={null}
        timezone="UTC"
      />,
    );
    expect(pageText()).toContain('Uploading…');
    expect(pageText()).toContain('Sync policy unavailable');
    expect(document.querySelector('[role="progressbar"]')?.getAttribute('aria-label')).toBe(
      'Uploading…',
    );
    expect(alert()).toBeNull();
  });

  it('says what the last sync came to, and announces it', async () => {
    await render(
      <LiveAnnouncer>
        <SyncBar
          stats={stats({
            pendingSync: 0,
            lastSyncAt: '2026-09-14T10:30:00.000Z',
            lastSyncOutcome: { kind: 'failed', reason: 'The portal could not be reached.' },
          })}
          settings={settings(5)}
          timezone="UTC"
        />
      </LiveAnnouncer>,
    );
    expect(document.querySelector('.MuiAlert-colorWarning .MuiAlert-message')?.textContent).toBe(
      'The portal could not be reached.',
    );
    expect(document.querySelector('[aria-live="polite"]')?.textContent).toBe(
      'The portal could not be reached.',
    );
    expect(pageText()).toContain('10:30 AM');
  });
});
