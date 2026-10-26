import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ProviderBillingNeed,
  ProviderLinkKind,
  ProviderSignInMethod,
  TechProviderLoginPasswordDocument,
} from '@exyconn/shell/graphql/generated';
import { ProviderAdvanced } from '../../../../../src/pages/environment-variables/advanced/ProviderAdvanced';
import { renderWithProviders, useCurrentUrl } from '../../../test-utils';

const gql = vi.hoisted(() => ({
  profile: vi.fn(),
  saveLogin: vi.fn(),
  deleteLogin: vi.fn(),
  saveLink: vi.fn(),
  deleteLink: vi.fn(),
  query: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useTechProviderProfileQuery: gql.profile,
  useSaveTechProviderLoginMutation: () => [gql.saveLogin],
  useDeleteTechProviderLoginMutation: () => [gql.deleteLogin],
  useSaveTechProviderLinkMutation: () => [gql.saveLink],
  useDeleteTechProviderLinkMutation: () => [gql.deleteLink],
}));
vi.mock('@apollo/client/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useApolloClient: () => ({ query: gql.query }),
}));

const profile = (need = ProviderBillingNeed.Required) => ({
  provider: 'openai',
  label: 'OpenAI',
  billing: { need, message: 'A separate billing key is required.' },
  steps: [{ description: 'Open API keys.' }, { description: 'Copy the key.' }],
  links: [
    { id: 'builtin-0', label: 'OpenAI API keys', url: 'https://platform.openai.com/api-keys', kind: ProviderLinkKind.ApiKeys, custom: false },
    { id: 'l1', label: 'Runbook', url: 'https://wiki.x/openai', kind: ProviderLinkKind.Docs, custom: true },
  ],
  logins: [
    { id: 'g1', label: 'Owner', username: 'ops@exyconn.com', signInMethod: ProviderSignInMethod.EmailPassword, hasPassword: true, passwordHint: '••••••••', notes: '' },
  ],
}); // prettier-ignore

function Url() {
  return <output aria-label="url">{useCurrentUrl()}</output>;
}

async function openAdvanced(need?: ProviderBillingNeed) {
  gql.profile.mockReturnValue({ data: { techProviderProfile: profile(need) } });
  const user = userEvent.setup();
  renderWithProviders(
    <>
      <ProviderAdvanced provider="openai" />
      <Url />
    </>,
  );
  await user.click(screen.getByRole('button', { name: /^Advanced/ }));
  return user;
}

const label = (text: string) => new RegExp(`^${text}\\s*\\*?$`);

beforeEach(() => {
  vi.clearAllMocks();
  for (const fn of [gql.saveLogin, gql.deleteLogin, gql.saveLink, gql.deleteLink]) {
    fn.mockResolvedValue({});
  }
});

describe('ProviderAdvanced', () => {
  it('says whether billing needs its own key, with a way to add one', async () => {
    const user = await openAdvanced();

    expect(screen.getByText('A separate billing key is required.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Billing keys' }));
    expect(screen.getByLabelText('url')).toHaveTextContent('/tech/environment-variables/billing-keys');
  });

  it('offers no billing shortcut when the current key is enough', async () => {
    await openAdvanced(ProviderBillingNeed.SameKey);
    expect(screen.queryByRole('button', { name: 'Billing keys' })).toBeNull();
  });

  it('lists the setup steps in order and the links, built-in ones without edit', async () => {
    await openAdvanced();

    const steps = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(steps.map((step) => step.textContent)).toEqual(['Open API keys.', 'Copy the key.']);
    expect(screen.getByRole('link', { name: /OpenAI API keys/ })).toHaveAttribute('target', '_blank');
    expect(screen.getAllByRole('button', { name: 'edit' })).toHaveLength(2); // one login, one custom link
  });

  it('shows nothing for a section without a guide, and says why the guide failed', () => {
    gql.profile.mockReturnValue({ data: { techProviderProfile: null } });
    const { container } = renderWithProviders(<ProviderAdvanced provider="dashboard" />);
    expect(container).toBeEmptyDOMElement();

    gql.profile.mockReturnValue({ data: undefined, error: new Error('Forbidden') });
    renderWithProviders(<ProviderAdvanced provider="openai" />);
    expect(screen.getByText('Forbidden')).toBeInTheDocument();
  });

  it('adds a login, keeping the password sealed on the server', async () => {
    const user = await openAdvanced();
    await user.click(screen.getByRole('button', { name: 'Add login' }));
    await user.type(await screen.findByLabelText(label('Account name')), 'Billing admin');
    await user.type(screen.getByLabelText(label('Email or username')), 'billing@exyconn.com');
    await user.type(screen.getByLabelText(label('Password')), 'pa55');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() =>
      expect(gql.saveLogin).toHaveBeenCalledWith({
        variables: {
          provider: 'openai',
          id: null,
          input: { label: 'Billing admin', username: 'billing@exyconn.com', signInMethod: 'EMAIL_PASSWORD', password: 'pa55', notes: '' },
        },
      }),
    );
    expect(await screen.findByText('Account added')).toBeInTheDocument();
  });

  it('shows a saved password on the eye, fetched fresh', async () => {
    gql.query.mockResolvedValue({ data: { techProviderLoginPassword: 'S3cret!' } });
    const user = await openAdvanced();
    const row = screen.getByText('ops@exyconn.com').closest('tr') as HTMLElement;
    await user.click(within(row).getByRole('button', { name: 'edit' }));
    await user.click(await screen.findByRole('button', { name: 'Show Password' }));

    expect(await screen.findByDisplayValue('S3cret!')).toBeInTheDocument();
    expect(gql.query).toHaveBeenCalledWith({
      query: TechProviderLoginPasswordDocument,
      variables: { provider: 'openai', id: 'g1' },
      fetchPolicy: 'no-cache',
    });
  });

  it('removes a login and a link once confirmed, and says when it could not', async () => {
    const user = await openAdvanced();
    const row = screen.getByText('ops@exyconn.com').closest('tr') as HTMLElement;
    await user.click(within(row).getByRole('button', { name: 'remove' }));
    await user.click(await screen.findByRole('button', { name: 'Remove' }));
    await waitFor(() => expect(gql.deleteLogin).toHaveBeenCalledWith({ variables: { provider: 'openai', id: 'g1' } }));

    gql.deleteLink.mockRejectedValueOnce(new Error('Locked'));
    const removeLink = await waitFor(() => screen.getAllByRole('button', { name: 'remove' })[1]);
    await user.click(removeLink);
    await user.click(await screen.findByRole('button', { name: 'Remove' }));
    expect(await screen.findByText('Locked')).toBeInTheDocument();
  });

  it('adds a link with its kind, refusing an address that is not https', async () => {
    const user = await openAdvanced();
    await user.click(screen.getByRole('button', { name: 'Add link' }));
    await user.type(await screen.findByLabelText(label('Link name')), 'Usage');
    await user.type(screen.getByLabelText(label('Address')), 'ftp://x');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByText('Enter a full address starting with http:// or https://')).toBeInTheDocument();

    await user.clear(screen.getByLabelText(label('Address')));
    await user.type(screen.getByLabelText(label('Address')), 'https://platform.openai.com/usage');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() =>
      expect(gql.saveLink).toHaveBeenCalledWith({
        variables: { provider: 'openai', id: null, input: { label: 'Usage', url: 'https://platform.openai.com/usage', kind: 'USAGE' } },
      }),
    );
  });

  it('edits a custom link and reports a failed save', async () => {
    gql.saveLink.mockRejectedValueOnce(new Error('Locked'));
    const user = await openAdvanced();
    const editLink = screen.getAllByRole('button', { name: 'edit' })[1];
    await user.click(editLink);
    expect(await screen.findByDisplayValue('Runbook')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Update' }));
    expect(await screen.findByText('Locked')).toBeInTheDocument();
  });
});
