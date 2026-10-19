import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { ChannelStatus } from '../../../../src/pages/integrations/ChannelStatus';
import { renderWithProviders } from '../../test-utils';

const HINT = 'Add an account to call from record pages.';

describe('ChannelStatus', () => {
  it('names the active provider of a connected channel', () => {
    renderWithProviders(<ChannelStatus ready provider="VOBIZ" hint={HINT} />);

    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByText('Active account: Vobiz')).toBeInTheDocument();
    expect(screen.queryByText(HINT)).not.toBeInTheDocument();
  });

  it('writes a provider it has no name for as given', () => {
    renderWithProviders(<ChannelStatus ready provider="PLIVO" hint={HINT} />);

    expect(screen.getByText('Active account: PLIVO')).toBeInTheDocument();
  });

  it('says only "Connected" when no provider is reported', () => {
    renderWithProviders(<ChannelStatus ready provider={null} hint={HINT} />);

    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.queryByText(/Active account/)).not.toBeInTheDocument();
    expect(screen.queryByText(HINT)).not.toBeInTheDocument();
  });

  it('shows what connecting enables while not connected', () => {
    renderWithProviders(<ChannelStatus ready={false} provider="TWILIO" hint={HINT} />);

    expect(screen.getByText('Not connected')).toBeInTheDocument();
    expect(screen.getByText(HINT)).toBeInTheDocument();
    expect(screen.queryByText(/Active account/)).not.toBeInTheDocument();
  });
});
