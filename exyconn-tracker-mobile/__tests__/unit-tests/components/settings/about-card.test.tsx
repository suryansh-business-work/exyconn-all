import { fireEvent, screen, waitFor } from '@testing-library/react';
import { copyrightNotice, type Branding } from '@exyconn/tracker-core';
import { describe, expect, it, vi } from 'vitest';
import { AboutCard } from '../../../../src/components/settings/AboutCard';
import { LinkRow } from '../../../../src/components/settings/LinkRow';
import { renderWithProviders } from '../../test-utils';
import { Linking } from '../../mocks/react-native/apis';

const BRANDING: Branding = {
  businessName: 'Acme Works',
  legalName: 'Acme Works Ltd',
  slogan: 'Work, measured fairly',
  logoUrl: '',
  logoDarkUrl: '',
  appIconUrl: '',
  faviconUrl: '',
  primaryColor: '#3355ff',
  secondaryColor: '#22aa88',
  accentColor: '#ff8800',
  backgroundColor: '#ffffff',
  textColor: '#111111',
  supportEmail: 'help@acme.example.test',
  websiteUrl: 'https://acme.example.test',
  copyrightText: '',
};

describe('LinkRow', () => {
  it('shows where the tap goes and opens it in the phone’s own app', () => {
    renderWithProviders(
      <LinkRow
        label="Support"
        value="help@acme.example.test"
        url="mailto:help@acme.example.test"
        icon="email-outline"
      />,
    );

    const link = screen.getByRole('link', { name: 'Support: help@acme.example.test' });
    expect(screen.getByText('help@acme.example.test')).toBeInTheDocument();
    fireEvent.click(link);

    expect(Linking.openURL).toHaveBeenCalledWith('mailto:help@acme.example.test');
  });

  it('logs, rather than swallows, a link the phone cannot open', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const cause = new Error('No mail app');
    Linking.openURL.mockRejectedValueOnce(cause);
    renderWithProviders(
      <LinkRow
        label="Support"
        value="help@acme.example.test"
        url="mailto:help@acme.example.test"
        icon="email-outline"
      />,
    );

    fireEvent.click(screen.getByRole('link', { name: 'Support: help@acme.example.test' }));

    await waitFor(() => expect(error).toHaveBeenCalledWith('Tracker action failed', cause));
  });
});

describe('AboutCard', () => {
  it('names nobody before the branding has loaded, but still carries a notice', () => {
    renderWithProviders(<AboutCard branding={null} />);

    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText(copyrightNotice(null))).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('says who makes the tracker and how to reach them, all from the branding', () => {
    renderWithProviders(<AboutCard branding={BRANDING} />);

    expect(screen.getByText('Acme Works')).toBeInTheDocument();
    expect(screen.getByText('Work, measured fairly')).toBeInTheDocument();
    expect(screen.getByText(copyrightNotice(BRANDING))).toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: 'Support: help@acme.example.test' }));
    expect(Linking.openURL).toHaveBeenLastCalledWith('mailto:help@acme.example.test');
    fireEvent.click(screen.getByRole('link', { name: 'Website: https://acme.example.test' }));
    expect(Linking.openURL).toHaveBeenLastCalledWith('https://acme.example.test');
  });

  it('leaves out each line the administrator left empty', () => {
    renderWithProviders(
      <AboutCard branding={{ ...BRANDING, businessName: '', supportEmail: '', websiteUrl: '' }} />,
    );

    expect(screen.getByText('Work, measured fairly')).toBeInTheDocument();
    expect(screen.queryByText('Acme Works')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('shows the name without a slogan when there is none', () => {
    renderWithProviders(<AboutCard branding={{ ...BRANDING, slogan: '' }} />);

    expect(screen.getByText('Acme Works')).toBeInTheDocument();
    expect(screen.queryByText('Work, measured fairly')).not.toBeInTheDocument();
  });

  it('uses the notice the administrator wrote, when there is one', () => {
    renderWithProviders(
      <AboutCard branding={{ ...BRANDING, copyrightText: 'Made with care by Acme.' }} />,
    );

    expect(screen.getByText('Made with care by Acme.')).toBeInTheDocument();
  });
});
