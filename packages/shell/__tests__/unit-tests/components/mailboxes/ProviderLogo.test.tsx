import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { ProviderLabel, ProviderLogo } from '@/components/mailboxes';
import twilioLogo from '@/assets/integrations/twilio.svg';
import { renderWithProviders } from '../../test-utils';

describe('ProviderLogo', () => {
  it('draws a decorative logo by default, hidden from screen readers', () => {
    const { container } = renderWithProviders(<ProviderLogo provider="TWILIO" />);

    const image = container.querySelector('img');
    expect(image).toHaveAttribute('alt', '');
    expect(image).toHaveAttribute('src', twilioLogo);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('names the provider when the logo stands alone', () => {
    renderWithProviders(<ProviderLogo provider="MSG91" size={32} decorative={false} />);

    expect(screen.getByRole('img', { name: 'MSG91 logo' })).toBeInTheDocument();
  });

  it('draws nothing for a provider without a logo', () => {
    const { container } = renderWithProviders(<ProviderLogo provider="ACME_TEL" />);

    expect(container).toBeEmptyDOMElement();
  });
});

describe('ProviderLabel', () => {
  it('writes the provider name next to its logo', () => {
    const { container } = renderWithProviders(<ProviderLabel provider="MICROSOFT" />);

    expect(screen.getByText('Microsoft')).toBeInTheDocument();
    expect(container.querySelector('img')).not.toBeNull();
  });

  it('falls back to the raw value, without a logo, for an unknown provider', () => {
    const { container } = renderWithProviders(<ProviderLabel provider="ACME_TEL" />);

    expect(screen.getByText('ACME_TEL')).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
  });
});
