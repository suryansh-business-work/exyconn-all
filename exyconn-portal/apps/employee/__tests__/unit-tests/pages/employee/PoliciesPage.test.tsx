import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAcknowledgePolicyMutation, useMyPoliciesQuery } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { mutationResult, queryResult, type QueryShape } from './helpers/apollo';
import { readOnly, signed, unsigned } from './helpers/policies';
import { PoliciesPage } from '../../../../src/pages/employee/PoliciesPage';

vi.mock('@exyconn/shell/hooks/useSettings', () => import('./helpers/settings'));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useMyPoliciesQuery: vi.fn(),
  useAcknowledgePolicyMutation: vi.fn(),
}));

function renderPage(query: QueryShape) {
  vi.mocked(useMyPoliciesQuery).mockReturnValue(queryResult(query));
  vi.mocked(useAcknowledgePolicyMutation).mockReturnValue(
    mutationResult(vi.fn(() => Promise.resolve({}))),
  );
  renderWithProviders(<PoliciesPage />);
  return userEvent.setup();
}

const cardTitles = () => screen.getAllByRole('heading', { level: 6 }).map((h) => h.textContent);

describe('PoliciesPage', () => {
  it('says it is loading before the first answer', () => {
    renderPage({ loading: true });
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('says none are published when the list is empty', () => {
    renderPage({ data: { myPolicies: [] } });
    expect(screen.getByText('No policies published yet.')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('puts the one policy to sign first and says it needs a signature', () => {
    renderPage({ data: { myPolicies: [signed, readOnly, unsigned] } });
    expect(screen.getByRole('alert')).toHaveTextContent('One policy needs your signature.');
    expect(cardTitles()).toEqual(['Code of conduct', 'Information security', 'Travel guidelines']);
  });

  it('counts the policies to sign when there is more than one', () => {
    const another = { ...unsigned, id: 'p4', title: 'Leave policy' };
    renderPage({ data: { myPolicies: [readOnly, unsigned, another] } });
    expect(screen.getByRole('alert')).toHaveTextContent('2 policies need your signature.');
    expect(cardTitles()).toEqual(['Code of conduct', 'Leave policy', 'Travel guidelines']);
  });

  it('raises no warning when everything is signed', () => {
    renderPage({ data: { myPolicies: [signed, readOnly] } });
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('opens a policy to read and closes it again', async () => {
    const user = renderPage({ data: { myPolicies: [readOnly] } });
    expect(screen.queryByRole('dialog')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Read' }));
    expect(await screen.findByRole('dialog')).toHaveTextContent('Travel guidelines');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('closes the reader and reloads the list once the policy is signed', async () => {
    const refetch = vi.fn(() => Promise.resolve({}));
    const user = renderPage({ data: { myPolicies: [unsigned] }, refetch });

    await user.click(screen.getByRole('button', { name: 'Read and sign' }));
    await user.type(
      await screen.findByRole('textbox', { name: 'Type your full name to sign' }),
      'Asha Rao',
    );
    await user.click(screen.getByRole('button', { name: 'Sign' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('keeps the page up when the reload after signing fails', async () => {
    const refetch = vi.fn(() => Promise.reject(new Error('offline')));
    const user = renderPage({ data: { myPolicies: [unsigned] }, refetch });

    await user.click(screen.getByRole('button', { name: 'Read and sign' }));
    await user.type(
      await screen.findByRole('textbox', { name: 'Type your full name to sign' }),
      'Asha Rao',
    );
    await user.click(screen.getByRole('button', { name: 'Sign' }));

    await waitFor(() => expect(refetch).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('heading', { level: 1, name: 'Policies' })).toBeInTheDocument();
  });
});
