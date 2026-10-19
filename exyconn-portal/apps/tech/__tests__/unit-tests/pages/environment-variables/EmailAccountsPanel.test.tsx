import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import {
  EMAIL_ACCOUNTS_PATH,
  EmailAccountsPanel,
} from '../../../../src/pages/environment-variables/EmailAccountsPanel';
import { renderWithProviders } from '../../test-utils';

vi.mock('../../../../src/pages/environment-variables/GmailPanel', async () =>
  (await import('./panel.harness')).panelModule('GmailPanel'),
);
vi.mock('../../../../src/pages/environment-variables/MicrosoftMailPanel', async () =>
  (await import('./panel.harness')).panelModule('MicrosoftMailPanel'),
);

describe('EmailAccountsPanel', () => {
  it('lives under Environment Variables as email-accounts', () => {
    expect(EMAIL_ACCOUNTS_PATH).toBe('/tech/environment-variables/email-accounts');
  });

  it('shows the Google and then the Microsoft OAuth app in one section', () => {
    renderWithProviders(<EmailAccountsPanel />);
    const google = screen.getByTestId('GmailPanel');
    const microsoft = screen.getByTestId('MicrosoftMailPanel');
    expect(
      google.compareDocumentPosition(microsoft) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByText(/Users only see a Connect button/)).toBeInTheDocument();
  });
});
