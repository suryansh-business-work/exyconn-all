import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrackerDeviceDetails } from '../../../../src/pages/tracker/TrackerDeviceDetails';
import { renderWithProviders } from '../../test-utils';
import { deviceRow } from './tracker.fixtures';
import { formatDateTime } from './tracker.mocks';

const workspace = { timezone: 'Asia/Kolkata', source: 'workspace' } as const;

/** The value printed under a fact's label. */
function factValue(dialog: HTMLElement, label: string): string {
  const caption = within(dialog).getByText(label);
  return caption.nextElementSibling?.textContent ?? '';
}

describe('TrackerDeviceDetails', () => {
  it('renders nothing when no device is open', () => {
    renderWithProviders(
      <TrackerDeviceDetails
        device={null}
        onClose={vi.fn()}
        formatDateTime={formatDateTime}
        timezone={workspace}
      />,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('lists every fact the agent reported, in reading order', () => {
    renderWithProviders(
      <TrackerDeviceDetails
        device={deviceRow({ totalMemoryMb: 12_800 })}
        onClose={vi.fn()}
        formatDateTime={formatDateTime}
        timezone={workspace}
      />,
    );
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('asha-mbp')).toBeInTheDocument();
    expect(within(dialog).getByText('ACTIVE')).toBeInTheDocument();
    expect(factValue(dialog, 'Machine ID')).toBe('machine-1');
    expect(factValue(dialog, 'Operating system')).toBe('macOS 15.1');
    expect(factValue(dialog, 'Platform')).toBe('darwin');
    expect(factValue(dialog, 'Architecture')).toBe('arm64');
    expect(factValue(dialog, 'CPU')).toBe('Apple M3');
    expect(factValue(dialog, 'CPU cores')).toBe('8');
    expect(factValue(dialog, 'Memory')).toBe('12.5 GB');
    expect(factValue(dialog, 'Locale')).toBe('en-IN');
    expect(factValue(dialog, 'Device timezone')).toBe('Asia/Kolkata');
    expect(factValue(dialog, 'Effective timezone')).toBe(
      'Asia/Kolkata (UTC+05:30 · workspace default)',
    );
    expect(factValue(dialog, 'Screens')).toBe('2');
    expect(factValue(dialog, 'Screen resolution')).toBe('3024x1964');
    expect(factValue(dialog, 'App version')).toBe('1.9.7');
    expect(factValue(dialog, 'Issued')).toBe('at 2026-01-01T08:00:00.000Z');
    expect(factValue(dialog, 'Last seen')).toBe('at 2026-01-15T10:00:00.000Z');
  });

  it('labels a revoked device inactive', () => {
    renderWithProviders(
      <TrackerDeviceDetails
        device={deviceRow({ isActive: false })}
        onClose={vi.fn()}
        formatDateTime={formatDateTime}
        timezone={workspace}
      />,
    );
    expect(within(screen.getByRole('dialog')).getByText('INACTIVE')).toBeInTheDocument();
  });

  it('closes from its Close button', async () => {
    const onClose = vi.fn();
    renderWithProviders(
      <TrackerDeviceDetails
        device={deviceRow()}
        onClose={onClose}
        formatDateTime={formatDateTime}
        timezone={workspace}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
