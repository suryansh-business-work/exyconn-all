import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { INFRASTRUCTURE_PATH, InfrastructurePage } from '../../../../src/pages/infrastructure';
import { renderWithProviders, useCurrentUrl } from '../../test-utils';

vi.mock('../../../../src/pages/infrastructure/HostPanel', () => ({
  HostPanel: () => <p>host panel</p>,
}));
vi.mock('../../../../src/pages/infrastructure/ContainersPanel', () => ({
  ContainersPanel: () => <p>containers panel</p>,
}));
vi.mock('../../../../src/pages/infrastructure/StoragePanel', () => ({
  StoragePanel: () => <p>storage panel</p>,
}));

function Url() {
  return <output aria-label="url">{useCurrentUrl()}</output>;
}

const renderAt = (route: string) =>
  renderWithProviders(
    <>
      <InfrastructurePage />
      <Url />
    </>,
    { route },
  );

describe('InfrastructurePage', () => {
  it('lives under /tech/infrastructure', () => {
    expect(INFRASTRUCTURE_PATH).toBe('/tech/infrastructure');
  });

  it('opens on the tab the URL names', () => {
    renderAt('/tech/infrastructure/containers');

    expect(screen.getByRole('heading', { name: 'Infrastructure' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Containers' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByText('containers panel')).toBeInTheDocument();
    expect(screen.queryByText('host panel')).not.toBeInTheDocument();
  });

  it('sends the bare path to the Host tab', async () => {
    renderAt('/tech/infrastructure');

    expect(await screen.findByText('host panel')).toBeInTheDocument();
    expect(screen.getByLabelText('url')).toHaveTextContent('/tech/infrastructure/host');
  });

  it('switches tabs through the URL', async () => {
    renderAt('/tech/infrastructure/host');
    await userEvent.click(screen.getByRole('tab', { name: 'Images & Storage' }));

    expect(await screen.findByText('storage panel')).toBeInTheDocument();
    expect(screen.getByLabelText('url')).toHaveTextContent('/tech/infrastructure/storage');
  });
});
