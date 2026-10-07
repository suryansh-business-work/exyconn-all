import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { ShareForm } from '../../../../../../src/pages/projects/forms/share';
import { renderWithProviders } from '../../../../test-utils';
import { fill, press } from '../../../../helpers/form-helpers';

const gql = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateProjectShareMutation: () => [gql.create],
}));

const LABEL = 'What is this link for?';
const DAYS = 'Expires in (days)';
const onCreated = vi.fn();
const onCancel = vi.fn();

const renderForm = () =>
  renderWithProviders(<ShareForm projectId="proj-1" onCreated={onCreated} onCancel={onCancel} />);

/** Fills the form and asks for the link. */
async function requestLink(label: string, days: string) {
  fill(LABEL, label);
  fill(DAYS, days);
  await press('Create link');
}

describe('ShareForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onCreated.mockResolvedValue(undefined);
    gql.create.mockResolvedValue({
      data: { createProjectShare: { url: 'https://portal.example/share/abc' } },
    });
  });

  it('starts with no name and a link that lasts thirty days', () => {
    renderForm();

    expect(screen.getByLabelText(LABEL)).toHaveValue('');
    expect(screen.getByLabelText(DAYS)).toHaveValue(30);
    expect(screen.getByText('Between 1 and 365 days')).toBeInTheDocument();
  });

  it('wants a name the link can be told apart by, kept short', async () => {
    renderForm();
    await press('Create link');
    expect(
      await screen.findByText('Give the link a name so you can tell it apart later'),
    ).toBeInTheDocument();

    fill(LABEL, 'x'.repeat(61));
    expect(await screen.findByText('Keep the name under 60 characters')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('wants a link to last at least a day', async () => {
    renderForm();

    await requestLink('Acme weekly', '0');

    expect(await screen.findByText('A link must last at least a day')).toBeInTheDocument();
  });

  it('wants a link to last at most a year', async () => {
    renderForm();

    await requestLink('Acme weekly', '366');

    expect(await screen.findByText('A link cannot last more than 365 days')).toBeInTheDocument();
  });

  it('wants a whole number of days', async () => {
    renderForm();

    await requestLink('Acme weekly', '1.5');

    expect(await screen.findByText('Must be a whole number of days')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('issues the link, hands the one-time URL over and clears the name for the next one', async () => {
    renderForm();

    await requestLink('  Acme weekly  ', '365');

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith('https://portal.example/share/abc'));
    expect(gql.create).toHaveBeenCalledWith({
      variables: { projectId: 'proj-1', label: 'Acme weekly', expiresInDays: 365 },
    });
    expect(screen.getByLabelText(LABEL)).toHaveValue('');
    expect(screen.getByLabelText(DAYS)).toHaveValue(365);
  });

  it('reports a link the server did not send back', async () => {
    gql.create.mockResolvedValueOnce({ data: undefined });
    renderForm();

    await requestLink('Acme weekly', '1');

    expect(await screen.findByText('The server returned no link')).toBeInTheDocument();
    expect(onCreated).not.toHaveBeenCalled();
  });

  it('reports a failed request in general terms when the error says nothing', async () => {
    gql.create.mockRejectedValueOnce('offline');
    renderForm();

    await requestLink('Acme weekly', '7');

    expect(await screen.findByText('Could not create the link')).toBeInTheDocument();
  });

  it('cancels without issuing anything', async () => {
    renderForm();

    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(gql.create).not.toHaveBeenCalled();
  });
});
