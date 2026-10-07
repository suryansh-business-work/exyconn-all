import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { TrackerDeviceLastSeen } from '../../../../src/pages/tracker/TrackerDeviceLastSeen';
import { renderWithProviders } from '../../test-utils';
import { isoAgo } from './tracker.fixtures';
import { formatDateTime } from './tracker.mocks';

describe('TrackerDeviceLastSeen', () => {
  it('marks an active device that checked in a moment ago as online', () => {
    const seen = isoAgo(10_000);
    renderWithProviders(
      <TrackerDeviceLastSeen lastSeenAt={seen} isActive formatDateTime={formatDateTime} />,
    );
    expect(screen.getByText('Online')).toBeInTheDocument();
    expect(screen.getByText(`at ${seen}`)).toBeInTheDocument();
  });

  it('shows only the time for a device that has gone quiet', () => {
    const seen = isoAgo(60 * 60_000);
    renderWithProviders(
      <TrackerDeviceLastSeen lastSeenAt={seen} isActive formatDateTime={formatDateTime} />,
    );
    expect(screen.queryByText('Online')).not.toBeInTheDocument();
    expect(screen.getByText(`at ${seen}`)).toBeInTheDocument();
  });

  it('never calls a revoked device online, however recent its last check-in', () => {
    const seen = isoAgo(5_000);
    renderWithProviders(
      <TrackerDeviceLastSeen lastSeenAt={seen} isActive={false} formatDateTime={formatDateTime} />,
    );
    expect(screen.queryByText('Online')).not.toBeInTheDocument();
    expect(screen.getByText(`at ${seen}`)).toBeInTheDocument();
  });
});
