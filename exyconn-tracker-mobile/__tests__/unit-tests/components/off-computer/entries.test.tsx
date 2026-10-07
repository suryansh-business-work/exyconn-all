import { fireEvent, screen } from '@testing-library/react';
import { formatDateTime } from '@exyconn/tracker-core';
import { describe, expect, it, vi } from 'vitest';
import { ManualEntryList } from '../../../../src/components/off-computer/ManualEntryList';
import { ManualEntryRow } from '../../../../src/components/off-computer/ManualEntryRow';
import { renderWithProviders } from '../../test-utils';
import { manualEntry } from '../state';

const ZONE = 'Asia/Kolkata';

describe('ManualEntryRow', () => {
  it('says how long, when, against what and why', () => {
    const entry = manualEntry();
    renderWithProviders(<ManualEntryRow entry={entry} timezone={ZONE} onWithdraw={vi.fn()} />);
    expect(screen.getByText('1h 30m')).toBeInTheDocument();
    expect(
      screen.getByText(
        `${formatDateTime(entry.startedAt, ZONE)} — ${formatDateTime(entry.endedAt, ZONE)}`,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Global Project')).toBeInTheDocument();
    expect(screen.getByText('Client visit')).toBeInTheDocument();
  });

  it('lets a pending claim be withdrawn, handing over the button that asked', () => {
    const onWithdraw = vi.fn();
    const entry = manualEntry();
    renderWithProviders(<ManualEntryRow entry={entry} timezone={ZONE} onWithdraw={onWithdraw} />);
    expect(screen.getByText('Waiting on a decision')).toBeInTheDocument();
    const button = screen.getByRole('button', { name: 'Withdraw' });
    fireEvent.click(button);
    expect(onWithdraw).toHaveBeenCalledWith(entry, button);
  });

  it('leaves an approved claim to the timesheet', () => {
    renderWithProviders(
      <ManualEntryRow
        entry={manualEntry({ status: 'APPROVED', reviewNote: '' })}
        timezone={ZONE}
        onWithdraw={vi.fn()}
      />,
    );
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByTestId('icon-check-circle-outline')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Withdraw' })).toBeNull();
    expect(screen.queryByText(/^Reviewer:/)).toBeNull();
  });

  it('shows why a reviewer rejected it, and the ticket it was booked to', () => {
    renderWithProviders(
      <ManualEntryRow
        entry={manualEntry({
          status: 'REJECTED',
          reviewNote: 'Not on the schedule',
          projectName: 'Website',
          taskKey: 'WEB-4',
          taskTitle: 'Launch',
        })}
        timezone={ZONE}
        onWithdraw={vi.fn()}
      />,
    );
    expect(screen.getByText('Rejected')).toBeInTheDocument();
    expect(screen.getByText('Reviewer: Not on the schedule')).toBeInTheDocument();
    expect(screen.getByText('Website · WEB-4 Launch')).toBeInTheDocument();
  });
});

describe('ManualEntryList', () => {
  it('says plainly when nothing has been claimed', () => {
    renderWithProviders(<ManualEntryList entries={[]} timezone={ZONE} onWithdraw={vi.fn()} />);
    expect(
      screen.getByText('You have not claimed any off-computer time in the last 90 days.'),
    ).toBeInTheDocument();
  });

  it('lists every claim, newest first, as given', () => {
    const entries = [
      manualEntry({ id: 'e2', note: 'Site visit' }),
      manualEntry({ id: 'e1', note: 'Client call', status: 'APPROVED' }),
    ];
    renderWithProviders(<ManualEntryList entries={entries} timezone={ZONE} onWithdraw={vi.fn()} />);
    const first = screen.getByText('Site visit');
    const second = screen.getByText('Client call');
    expect(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Withdraw' })).toHaveLength(1);
  });

  it('passes a withdraw request up from its row', () => {
    const onWithdraw = vi.fn();
    const entry = manualEntry();
    renderWithProviders(
      <ManualEntryList entries={[entry]} timezone={ZONE} onWithdraw={onWithdraw} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Withdraw' }));
    expect(onWithdraw).toHaveBeenCalledWith(entry, expect.any(HTMLElement));
  });
});
