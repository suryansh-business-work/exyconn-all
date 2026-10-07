import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { LogSummary } from '../../../../../src/pages/logs/LogDetailDialog/LogSummary';
import { renderWithProviders } from '../../../test-utils';
import { logRow } from '../log.fixtures';

vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('../log.fixtures')).settingsModule(),
);

function valueOf(label: string): string | null {
  return screen.getByText(label).parentElement?.textContent ?? null;
}

describe('LogSummary', () => {
  it('shows the problem’s level, status, source and numbers', () => {
    renderWithProviders(<LogSummary row={logRow()} />);

    expect(valueOf('Level')).toBe('LevelERROR');
    expect(valueOf('Status')).toBe('StatusOPEN');
    expect(valueOf('Source')).toBe('SourceMOBILE');
    expect(valueOf('App')).toBe('Apptracker-mobile');
    expect(valueOf('Times')).toBe(`Times${(1200).toLocaleString()}`);
    expect(valueOf('People')).toBe('People3');
    expect(valueOf('Last seen by')).toBe('Last seen byAsha Rao');
    expect(valueOf('First seen')).toBe('First seenat 2026-10-01T09:00:00.000Z');
    expect(valueOf('Last seen')).toBe('Last seenat 2026-10-07T09:00:00.000Z');
    expect(valueOf('Screen / page')).toBe('Screen / page/timer');
    expect(valueOf('Platform')).toBe('Platformandroid');
    expect(valueOf('Version')).toBe('Version1.9.7');
  });

  it('falls back to the email, then to nobody, for who saw it last', () => {
    const { unmount } = renderWithProviders(<LogSummary row={logRow({ lastUserName: '' })} />);
    expect(valueOf('Last seen by')).toBe('Last seen byasha@example.test');
    unmount();

    renderWithProviders(<LogSummary row={logRow({ lastUserName: '', lastUserEmail: '' })} />);
    expect(valueOf('Last seen by')).toBe('Last seen byNobody signed in');
  });

  it('dashes the screen, platform and version it was not told', () => {
    renderWithProviders(<LogSummary row={logRow({ route: '', platform: '', appVersion: '' })} />);

    expect(valueOf('Screen / page')).toBe('Screen / page—');
    expect(valueOf('Platform')).toBe('Platform—');
    expect(valueOf('Version')).toBe('Version—');
  });
});
