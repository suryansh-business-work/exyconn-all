import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { EmailVerificationSource } from '@exyconn/shell/graphql/generated';
import { SingleCheckPanel } from '../../../../src/pages/email-verifier/SingleCheckPanel';
import { renderWithProviders } from '../../test-utils';
import { fillField, press } from '../../form-helpers';
import { verification } from './email-verifier-fixtures';

const gql = vi.hoisted(() => ({ verify: vi.fn(), loading: false }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useVerifyEmailMutation: () => [gql.verify, { loading: gql.loading }],
}));

async function check(email = 'asha@acme.com') {
  await fillField('Email address', email);
  await press('Check');
}

describe('SingleCheckPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.loading = false;
    gql.verify.mockResolvedValue({ data: { verifyEmail: verification() } });
  });

  it('checks the address as a single check and shows the result', async () => {
    renderWithProviders(<SingleCheckPanel />);

    await check();

    expect(gql.verify).toHaveBeenCalledWith({
      variables: { email: 'asha@acme.com', source: EmailVerificationSource.Single },
    });
    expect(await screen.findByRole('heading', { name: 'asha@acme.com' })).toBeInTheDocument();
  });

  it('shows no result when the server answers without one', async () => {
    gql.verify.mockResolvedValue({ data: null });
    renderWithProviders(<SingleCheckPanel />);

    await check();

    expect(gql.verify).toHaveBeenCalled();
    expect(screen.queryByRole('heading', { name: 'asha@acme.com' })).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it("shows the server's reason when the check fails, and clears it on the next try", async () => {
    gql.verify.mockRejectedValueOnce(new Error('Rate limited'));
    renderWithProviders(<SingleCheckPanel />);

    await check();
    expect(await screen.findByText('Rate limited')).toBeInTheDocument();

    await check();
    expect(await screen.findByRole('heading', { name: 'asha@acme.com' })).toBeInTheDocument();
    expect(screen.queryByText('Rate limited')).not.toBeInTheDocument();
  });

  it('falls back to a plain message when the failure carries none', async () => {
    gql.verify.mockRejectedValue('offline');
    renderWithProviders(<SingleCheckPanel />);

    await check();

    expect(await screen.findByText('Could not check the email')).toBeInTheDocument();
  });

  it('locks the form while a check runs', () => {
    gql.loading = true;
    renderWithProviders(<SingleCheckPanel />);

    expect(screen.getByRole('button', { name: 'Checking…' })).toBeDisabled();
  });
});
