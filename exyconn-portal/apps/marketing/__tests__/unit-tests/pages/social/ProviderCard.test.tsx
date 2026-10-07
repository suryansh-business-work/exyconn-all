import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { SocialNetwork } from '@exyconn/shell/graphql/generated';
import { ProviderCard } from '../../../../src/pages/social/ProviderCard';
import { renderWithProviders } from '../../test-utils';
import { providerRow } from '../../fixtures';

describe('ProviderCard', () => {
  it('says what connecting adds and connects on click', async () => {
    const onConnect = vi.fn();
    renderWithProviders(
      <ProviderCard provider={providerRow()} connecting={false} onConnect={onConnect} />,
    );

    expect(screen.getByText('Meta')).toBeInTheDocument();
    expect(screen.getByText('Adds: Facebook Pages, Instagram Business')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Connect' }));

    expect(onConnect).toHaveBeenCalledTimes(1);
  });

  it('shows a network it has no friendly name for as it is', () => {
    const provider = providerRow({ networks: ['THREADS', 'MASTODON'] as SocialNetwork[] });
    renderWithProviders(
      <ProviderCard provider={provider} connecting={false} onConnect={vi.fn()} />,
    );

    expect(screen.getByText('Adds: Threads profile, MASTODON')).toBeInTheDocument();
  });

  it('is busy while the consent page opens', () => {
    renderWithProviders(<ProviderCard provider={providerRow()} connecting onConnect={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Opening…' })).toBeDisabled();
  });

  it('explains why a provider Tech has not set up cannot be connected', () => {
    renderWithProviders(
      <ProviderCard
        provider={providerRow({ available: false })}
        connecting={false}
        onConnect={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Connect' })).toBeDisabled();
    expect(
      screen.getByText('Not set up yet — Tech adds it under Environment Variables › Social apps.'),
    ).toBeInTheDocument();
  });
});
