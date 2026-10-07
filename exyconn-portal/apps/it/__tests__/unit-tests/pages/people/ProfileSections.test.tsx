import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { AssetEdrStatus, ItAccessKind, LicenceStatus } from '@exyconn/shell/graphql/generated';
import {
  AccessSection,
  DevicesSection,
  LicencesSection,
  RequestsSection,
} from '../../../../src/pages/people/ProfileSections';
import { renderWithProviders } from '../../test-utils';
import { accessGrant, openRequest, profileAsset, profileRow } from '../page-kit/people.fixtures';

vi.mock(
  '@exyconn/shell/hooks/useSettings',
  async () => (await import('../page-kit/settings.mock')).settingsModule,
);

describe('DevicesSection', () => {
  it('links each device to its asset page with its protection and serial', () => {
    const profile = profileRow({
      assets: [profileAsset({ edrStatus: AssetEdrStatus.Outdated })],
    });
    renderWithProviders(<DevicesSection profile={profile} />);

    expect(screen.getByRole('link', { name: 'LT-7 · MacBook Air' })).toHaveAttribute(
      'href',
      '/it/assets/asset-1',
    );
    expect(screen.getByText('OUTDATED')).toBeInTheDocument();
    expect(screen.getByText('SN-123')).toBeInTheDocument();
    expect(screen.queryByText('None')).not.toBeInTheDocument();
  });

  it('leaves the serial out when the device has none', () => {
    const profile = profileRow({ assets: [profileAsset({ serialNumber: '' })] });
    renderWithProviders(<DevicesSection profile={profile} />);

    expect(screen.queryByText('SN-123')).not.toBeInTheDocument();
    expect(screen.getByText('PROTECTED')).toBeInTheDocument();
  });
});

describe('AccessSection', () => {
  it('shows the level when there is one, and the expiry before the grant date', () => {
    const profile = profileRow({
      access: [
        accessGrant({ application: 'GitHub', accessLevel: 'Admin', expiresAt: '2026-12-31' }),
        accessGrant({ application: 'VPN', grantedAt: '2026-08-01' }),
      ],
    });
    renderWithProviders(<AccessSection profile={profile} />);

    expect(screen.getByText('GitHub · Admin')).toBeInTheDocument();
    expect(screen.getByText('date(2026-12-31)')).toBeInTheDocument();
    expect(screen.getByText('VPN')).toBeInTheDocument();
    expect(screen.getByText('date(2026-08-01)')).toBeInTheDocument();
  });
});

describe('LicencesSection', () => {
  it('lists each seat with its vendor, state and renewal', () => {
    const profile = profileRow({
      licences: [
        {
          __typename: 'EmployeeLicenceSeat',
          id: 'licence-1',
          name: 'Figma',
          vendor: 'Figma Inc',
          renewalDate: '2026-12-01',
          status: LicenceStatus.Cancelled,
        },
      ],
    });
    renderWithProviders(<LicencesSection profile={profile} />);

    expect(screen.getByText('Figma · Figma Inc')).toBeInTheDocument();
    expect(screen.getByText('CANCELLED')).toBeInTheDocument();
    expect(screen.getByText('date(2026-12-01)')).toBeInTheDocument();
  });
});

describe('RequestsSection', () => {
  it('writes the request kind in plain words next to its status', () => {
    const profile = profileRow({
      openRequests: [
        openRequest(),
        openRequest({ id: 'request-2', application: 'Jira', kind: ItAccessKind.Grant }),
      ],
    });
    renderWithProviders(<RequestsSection profile={profile} />);

    expect(screen.getByText('Zoom · role change')).toBeInTheDocument();
    expect(screen.getByText('Jira · grant')).toBeInTheDocument();
    expect(screen.getAllByText('PENDING')).toHaveLength(2);
  });
});
