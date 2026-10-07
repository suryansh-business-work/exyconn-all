// @vitest-environment jsdom
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  LiveAnnouncer,
  QUIET_NOTICES,
  useAnnounce,
  type Politeness,
} from '../../../../src/renderer/a11y/LiveAnnouncer';
import { flush, render, rerender, unmountAll } from '../../test-utils';

afterEach(unmountAll);

function Speaker({
  message,
  politeness,
}: Readonly<{ message: string | null | undefined; politeness?: Politeness }>): ReactElement {
  useAnnounce(message, politeness);
  return <span>{message ?? 'silent'}</span>;
}

function polite(): string | null | undefined {
  return document.querySelector('[role="status"]')?.textContent;
}

function assertive(): string | null | undefined {
  return document.querySelector('[role="alert"]')?.textContent;
}

describe('LiveAnnouncer', () => {
  it('renders its children and two empty, atomic live regions from the first paint', async () => {
    await render(
      <LiveAnnouncer>
        <p>content</p>
      </LiveAnnouncer>,
    );
    expect(document.body.textContent).toContain('content');
    const status = document.querySelector('[role="status"]');
    const alert = document.querySelector('[role="alert"]');
    expect(status?.getAttribute('aria-live')).toBe('polite');
    expect(alert?.getAttribute('aria-live')).toBe('assertive');
    expect(status?.getAttribute('aria-atomic')).toBe('true');
    expect(alert?.getAttribute('aria-atomic')).toBe('true');
    expect(polite()).toBe('');
    expect(assertive()).toBe('');
  });

  it('speaks a message politely by default', async () => {
    await render(
      <LiveAnnouncer>
        <Speaker message="Tracking started." />
      </LiveAnnouncer>,
    );
    expect(polite()).toBe('Tracking started.');
    expect(assertive()).toBe('');
  });

  it('speaks an error through the assertive region', async () => {
    await render(
      <LiveAnnouncer>
        <Speaker message="Sync failed." politeness="assertive" />
      </LiveAnnouncer>,
    );
    expect(assertive()).toBe('Sync failed.');
    expect(polite()).toBe('');
  });

  it('says nothing for null, undefined or an empty message', async () => {
    await render(
      <LiveAnnouncer>
        <Speaker message={null} />
        <Speaker message={undefined} politeness="assertive" />
        <Speaker message="" />
      </LiveAnnouncer>,
    );
    expect(polite()).toBe('');
    expect(assertive()).toBe('');
  });

  it('reads messages that arrive in the same render together, once each', async () => {
    await render(
      <LiveAnnouncer>
        <Speaker message="You are tracking." />
        <Speaker message="Version 2 is available." />
        <Speaker message="You are tracking." />
      </LiveAnnouncer>,
    );
    expect(polite()).toBe('You are tracking. Version 2 is available.');
  });

  it('keeps the polite and assertive batches apart', async () => {
    await render(
      <LiveAnnouncer>
        <Speaker message="Saved." />
        <Speaker message="Offline." politeness="assertive" />
      </LiveAnnouncer>,
    );
    expect(polite()).toBe('Saved.');
    expect(assertive()).toBe('Offline.');
  });

  it('replaces the text with the next message once the batch has been read', async () => {
    await render(
      <LiveAnnouncer>
        <Speaker message="Paused." />
      </LiveAnnouncer>,
    );
    expect(polite()).toBe('Paused.');
    await flush();
    await rerender(
      <LiveAnnouncer>
        <Speaker message="Resumed." />
      </LiveAnnouncer>,
    );
    expect(polite()).toBe('Resumed.');
  });

  it('speaks an unchanged message again when its politeness changes', async () => {
    await render(
      <LiveAnnouncer>
        <Speaker message="Saved." />
      </LiveAnnouncer>,
    );
    await flush();
    await rerender(
      <LiveAnnouncer>
        <Speaker message="Saved." politeness="assertive" />
      </LiveAnnouncer>,
    );
    expect(assertive()).toBe('Saved.');
    expect(polite()).toBe('Saved.');
  });
});

describe('useAnnounce outside an announcer', () => {
  it('is a harmless no-op', async () => {
    await render(<Speaker message="Nobody hears this." />);
    expect(document.body.textContent).toBe('Nobody hears this.');
    expect(document.querySelector('[aria-live]')).toBeNull();
  });
});

describe('QUIET_NOTICES', () => {
  it('stops MUI alerts and snackbars announcing themselves', () => {
    expect(QUIET_NOTICES.components.MuiAlert.defaultProps.role).toBe('none');
    expect(QUIET_NOTICES.components.MuiSnackbarContent.defaultProps.role).toBe('none');
  });
});
