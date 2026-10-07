import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test-utils';
import { MyTrackerAccessBanner } from '../../../../src/pages/employee/MyTrackerAccessBanner';

const formatDate = (value: string | Date | null | undefined) => `on ${String(value)}`;

const access = {
  id: 'ta1',
  userId: 'u1',
  grantedBy: 'u9',
  grantedAt: '2026-02-01T09:00:00.000Z',
  revokedAt: null,
  isActive: true,
  consentedAt: '2026-02-01T09:05:00.000Z',
  timezone: 'Asia/Kolkata',
};

const NO_ACCESS = 'No tracker access — desktop tracking is not enabled for your account.';

describe('MyTrackerAccessBanner', () => {
  it('says tracking is off when no access was ever granted', () => {
    renderWithProviders(<MyTrackerAccessBanner access={null} formatDate={formatDate} />);
    expect(screen.getByRole('alert')).toHaveTextContent(NO_ACCESS);
  });

  it('says tracking is off once access has been revoked', () => {
    renderWithProviders(
      <MyTrackerAccessBanner
        access={{ ...access, isActive: false, revokedAt: '2026-03-01T00:00:00.000Z' }}
        formatDate={formatDate}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(NO_ACCESS);
  });

  it('says since when tracking has been on', () => {
    renderWithProviders(<MyTrackerAccessBanner access={access} formatDate={formatDate} />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Tracking enabled since on 2026-02-01T09:00:00.000Z.',
    );
  });
});
