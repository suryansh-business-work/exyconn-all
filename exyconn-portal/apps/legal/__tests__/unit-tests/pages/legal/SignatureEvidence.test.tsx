import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignatureEvidence } from '../../../../src/pages/legal/SignatureEvidence';
import { renderWithProviders } from '../../test-utils';
import { signature, type Signature } from './legal.fixtures';

const gql = vi.hoisted(() => ({ query: vi.fn(), revoke: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useContractSignaturesQuery: gql.query,
  useRevokeContractSignatureMutation: () => [gql.revoke],
}));
vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('../../settings.mock')).settingsModuleMock(),
);

/** A documentation-range address, built at runtime rather than written as a literal. */
const SIGNER_IP = [203, 0, 113, 7].join('.');

const answer = (rows: Signature[] | undefined, extra: object = {}) =>
  gql.query.mockReturnValue({
    data: rows && { contractSignatures: rows },
    loading: false,
    error: undefined,
    refetch: gql.refetch,
    ...extra,
  });

const SIGNED = signature({
  id: 'signature-2',
  signerName: 'Asha Rao',
  signedAt: '2026-10-03T09:00:00.000Z',
  signedName: 'Asha Rao',
  signedIp: SIGNER_IP,
  documentSha256: 'ab12cd34',
});

const renderEvidence = () => renderWithProviders(<SignatureEvidence contractId="contract-1" />);

/** Opens the withdraw prompt for the only waiting request and returns the dialog. */
async function openWithdraw() {
  await userEvent.click(screen.getByRole('button', { name: 'Withdraw' }));
  return within(await screen.findByRole('dialog'));
}

describe('SignatureEvidence', () => {
  beforeEach(() => {
    gql.query.mockReset();
    gql.revoke.mockReset().mockResolvedValue({ data: { revokeContractSignature: true } });
    gql.refetch.mockReset().mockResolvedValue({ data: {} });
  });

  it('asks for the requests on this contract, fresh from the server', () => {
    answer([]);
    renderEvidence();
    expect(gql.query).toHaveBeenCalledWith({
      variables: { contractId: 'contract-1' },
      fetchPolicy: 'cache-and-network',
    });
  });

  it('shows progress, and no empty note, while the first answer is on its way', () => {
    answer(undefined, { loading: true });
    renderEvidence();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByText('Nobody has been asked to sign this yet.')).not.toBeInTheDocument();
  });

  it('says nobody has been asked yet when there are no requests', () => {
    answer([]);
    renderEvidence();
    expect(screen.getByText('Nobody has been asked to sign this yet.')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('keeps showing the requests it has while a refetch runs', () => {
    answer([signature()], { loading: true });
    renderEvidence();
    expect(screen.getByText('Bob Stone')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('shows why the requests could not be read', () => {
    answer([], { error: new Error('Not allowed') });
    renderEvidence();
    expect(screen.getByRole('alert')).toHaveTextContent('Not allowed');
  });

  it('falls back to a plain word when the failure carries no message', () => {
    answer([], { error: 'offline' });
    renderEvidence();
    expect(screen.getByRole('alert')).toHaveTextContent('Unavailable.');
  });

  it('records what came back from a signer: the name typed, when, where from and the fingerprint', () => {
    answer([SIGNED]);
    renderEvidence();
    expect(screen.getByText('Signed')).toBeInTheDocument();
    expect(
      screen.getByText(`Signed as “Asha Rao” on at 2026-10-03T09:00:00.000Z, from ${SIGNER_IP}`),
    ).toBeInTheDocument();
    expect(screen.getByText('Document fingerprint ab12cd34')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Withdraw' })).not.toBeInTheDocument();
  });

  it('says the address is unknown when the signer’s was not recorded', () => {
    answer([{ ...SIGNED, signedIp: '' }]);
    renderEvidence();
    expect(screen.getByText(/from an unknown address$/)).toBeInTheDocument();
  });

  it('marks a withdrawn request, which can no longer be withdrawn', () => {
    answer([signature({ revokedAt: '2026-10-02T00:00:00.000Z' })]);
    renderEvidence();
    expect(screen.getByText('Withdrawn')).toBeInTheDocument();
    expect(screen.getByText('Link expires at 2026-11-01T00:00:00.000Z')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Withdraw' })).not.toBeInTheDocument();
  });

  it('shows a waiting request with its address and when its link expires', () => {
    answer([signature()]);
    renderEvidence();
    expect(screen.getByText('Waiting')).toBeInTheDocument();
    expect(screen.getByText('bob@acme.example')).toBeInTheDocument();
    expect(screen.getByText('Link expires at 2026-11-01T00:00:00.000Z')).toBeInTheDocument();
  });

  it('leaves a request alone when the withdraw prompt is cancelled', async () => {
    answer([signature()]);
    renderEvidence();
    const dialog = await openWithdraw();
    expect(dialog.getByText('Withdraw this request?')).toBeInTheDocument();
    expect(
      dialog.getByText('The link sent to Bob Stone stops working immediately.'),
    ).toBeInTheDocument();

    await userEvent.click(dialog.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(gql.revoke).not.toHaveBeenCalled();
  });

  it('withdraws a waiting request once confirmed, then re-reads the list', async () => {
    answer([signature()]);
    renderEvidence();
    const dialog = await openWithdraw();
    await userEvent.click(dialog.getByRole('button', { name: 'Withdraw' }));

    expect(await screen.findByText('The request has been withdrawn.')).toBeInTheDocument();
    expect(gql.revoke).toHaveBeenCalledWith({ variables: { id: 'signature-1' } });
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('says why a withdrawal failed', async () => {
    gql.revoke.mockRejectedValue(new Error('Already signed'));
    answer([signature()]);
    renderEvidence();
    const dialog = await openWithdraw();
    await userEvent.click(dialog.getByRole('button', { name: 'Withdraw' }));

    expect(await screen.findByText('Already signed')).toBeInTheDocument();
    expect(gql.refetch).not.toHaveBeenCalled();
  });

  it('falls back to a plain message when the failed withdrawal carries none', async () => {
    gql.revoke.mockRejectedValue('offline');
    answer([signature()]);
    renderEvidence();
    const dialog = await openWithdraw();
    await userEvent.click(dialog.getByRole('button', { name: 'Withdraw' }));

    expect(await screen.findByText('It could not be withdrawn.')).toBeInTheDocument();
  });
});
