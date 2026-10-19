import { afterEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import {
  oauthReturnAddress,
  useOAuthReturnNotice,
  type OAuthReturnKeys,
} from '../../../src/integrations/useOAuthReturn';
import { renderWithProviders, useCurrentUrl } from '../test-utils';

const KEYS: OAuthReturnKeys = { connected: 'gmailConnected', failed: 'gmailError' };

function Page() {
  useOAuthReturnNotice(KEYS, 'Connected {email}');
  return <output aria-label="Address">{useCurrentUrl()}</output>;
}

function renderPage(route: string) {
  renderWithProviders(<Page />, { route });
}

const address = () => screen.getByRole('status', { name: 'Address' });

describe('oauthReturnAddress', () => {
  afterEach(() => {
    globalThis.history.replaceState(null, '', '/');
  });

  it('is this page without the outcome of an earlier try', () => {
    globalThis.history.replaceState(
      null,
      '',
      '/integrations/email?tab=gmail&gmailConnected=a%40b.c&gmailError=denied',
    );

    expect(oauthReturnAddress(KEYS)).toBe('http://localhost:3000/integrations/email?tab=gmail');
  });
});

describe('useOAuthReturnNotice', () => {
  it('announces the connected mailbox once and takes it off the address', async () => {
    renderPage('/integrations/email?tab=gmail&gmailConnected=sales%40acme.example');

    expect(await screen.findByText('Connected sales@acme.example')).toBeInTheDocument();
    expect(address()).toHaveTextContent(/^\/integrations\/email\?tab=gmail$/);
  });

  it('announces the failure reason over a success and clears both', async () => {
    renderPage('/integrations/email?gmailConnected=x%40y.z&gmailError=Access+was+denied');

    expect(await screen.findByText('Access was denied')).toBeInTheDocument();
    expect(screen.queryByText('Connected x@y.z')).not.toBeInTheDocument();
    expect(address()).toHaveTextContent(/^\/integrations\/email$/);
  });

  it('announces a bare success with a blank address', async () => {
    renderPage('/integrations/email?gmailConnected=');

    expect(await screen.findByText(/^Connected\s*$/)).toBeInTheDocument();
  });

  it('says nothing and leaves the address alone without an outcome', () => {
    renderPage('/integrations/email?tab=gmail');

    expect(address()).toHaveTextContent(/^\/integrations\/email\?tab=gmail$/);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
