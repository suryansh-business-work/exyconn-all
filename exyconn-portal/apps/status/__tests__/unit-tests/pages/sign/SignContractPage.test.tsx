import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockLink } from '@apollo/client/testing';
import { SignContractPage } from '../../../../src/pages/sign';
import { renderWithProviders } from '../../test-utils';
import { CurrentUrl, currentUrl } from '../../form-helpers';
import { DOCUMENT_HASH, TOKEN, contract, contractLookup, signed } from './contract.fixtures';

const AGREE = 'I have read this contract and agree to be bound by it';

function renderSign(
  mocks: MockLink.MockedResponse[],
  route = `/sign/${TOKEN}`,
  path = '/sign/:token',
) {
  renderWithProviders(
    <>
      <SignContractPage />
      <CurrentUrl />
    </>,
    { mocks, route, path },
  );
}

describe('SignContractPage', () => {
  it('waits for the contract, then sets out what is being signed', async () => {
    renderSign([contractLookup(contract())]);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    expect(await screen.findByText('Sign “MSA 2026”')).toBeInTheDocument();
    expect(screen.getByText('Sent to Ada Lovelace. Read it, then sign below.')).toBeInTheDocument();
    expect(screen.getByText('Globex Ltd')).toBeInTheDocument();
    expect(screen.getByText('MSA')).toBeInTheDocument();
    expect(screen.getByText('1 Jan 2026')).toBeInTheDocument();
    expect(screen.getByText('31 Dec 2026')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Read the document' })).toHaveAttribute(
      'href',
      'https://files.example.com/msa-2026.pdf',
    );
    expect(screen.getByLabelText('Your full name')).toHaveValue('Ada Lovelace');
  });

  it('records the signature and hands back the document fingerprint', async () => {
    renderSign([contractLookup(contract()), signed('Ada Lovelace')]);
    await userEvent.click(await screen.findByLabelText(AGREE));
    await userEvent.click(screen.getByRole('button', { name: 'Sign' }));

    expect(await screen.findByText('Signed')).toBeInTheDocument();
    expect(
      screen.getByText('“MSA 2026” is signed. A copy of this confirmation is worth keeping.'),
    ).toBeInTheDocument();
    expect(screen.getByText(DOCUMENT_HASH)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Back to status' }));
    expect(currentUrl()).toBe('/');
  });

  it('says a contract was already signed instead of offering the form again', async () => {
    renderSign([
      contractLookup(contract({ signedAt: '2026-09-01T10:00:00.000Z', documentUrl: '' })),
    ]);
    expect(await screen.findByText('This contract has already been signed.')).toBeInTheDocument();
    expect(screen.getByText('Globex Ltd')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Read the document' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sign' })).not.toBeInTheDocument();
  });

  it('gives one message for a link that does not work, with a way back', async () => {
    renderSign([contractLookup(null)]);
    expect(await screen.findByText('This link does not work')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Back to status' }));
    expect(currentUrl()).toBe('/');
  });

  it('does not even ask the API when the link carries no token', () => {
    renderSign([], '/sign', '/sign');
    expect(screen.getByText('This link does not work')).toBeInTheDocument();
  });

  it('leaves without signing on Cancel', async () => {
    renderSign([contractLookup(contract())]);
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    expect(currentUrl()).toBe('/');
  });
});
