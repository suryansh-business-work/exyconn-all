import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SuppressionReason } from '@exyconn/shell/graphql/generated';
import { SuppressionForm } from '../../../../../../src/pages/suppression/forms/suppression';
import { renderWithProviders } from '../../../../test-utils';
import { suppressionRow } from '../../../../fixtures';
import { chooseOption, fill, press } from '../../../../form-helpers';
import { lookup } from '../../suppression.fixtures';
import { typeInto } from '../../suppression.helpers';

interface LookupOptions {
  variables: { email: string };
  skip: boolean;
}

const gql = vi.hoisted(() => ({ lookup: vi.fn(), create: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useMarketingSuppressionLookupQuery: (options: LookupOptions) => gql.lookup(options),
  useCreateMarketingSuppressionMutation: () => [gql.create],
}));

/** The lookup hook answers `answer` for any address it is not told to skip. */
function lookupAnswers(answer: { data?: unknown; loading: boolean }) {
  gql.lookup.mockImplementation((options: LookupOptions) =>
    options.skip ? { data: undefined, loading: false } : answer,
  );
}

/** Waits until the debounced lookup has run for `email`. */
async function lookedUp(email: string) {
  await waitFor(() =>
    expect(gql.lookup).toHaveBeenLastCalledWith(
      expect.objectContaining({ variables: { email }, skip: false }),
    ),
  );
}

function renderForm() {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(<SuppressionForm onDone={onDone} onCancel={onCancel} />);
  return { onDone, onCancel };
}

describe('SuppressionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lookupAnswers({ data: { marketingSuppressionLookup: lookup() }, loading: false });
    gql.create.mockResolvedValue({ data: { createMarketingSuppression: { id: 'suppression-9' } } });
  });

  it('explains the effect and fixes the source and scope', () => {
    renderForm();

    expect(
      screen.getByText(/excluded from all marketing campaigns, newsletters/),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Source')).toHaveValue('Admin');
    expect(screen.getByLabelText('Source')).toBeDisabled();
    expect(screen.getByLabelText('Scope')).toHaveValue('Organization-wide marketing');
    expect(screen.getByLabelText('Scope')).toBeDisabled();
    expect(screen.getByText('Your team decided not to email this address.')).toBeInTheDocument();
    expect(gql.lookup).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { email: '' }, skip: true }),
    );
  });

  it('requires an email address before saving', async () => {
    renderForm();

    await press('Add address');

    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('rejects a malformed address and never looks it up', async () => {
    renderForm();
    typeInto('Email address', 'not-an-email');

    await press('Add address');

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(gql.lookup).not.toHaveBeenCalledWith(expect.objectContaining({ skip: false }));
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('looks up the trimmed, lower-cased address once typing pauses', async () => {
    renderForm();
    typeInto('Email address', '  Gone@Acme.IO ');

    await lookedUp('gone@acme.io');
    expect(screen.getByText('No CRM contact or company uses this address.')).toBeInTheDocument();
  });

  it('shows the lookup placeholder while the CRM answers', async () => {
    lookupAnswers({ data: undefined, loading: true });
    renderForm();
    typeInto('Email address', 'gone@acme.io');

    expect(await screen.findByLabelText('Looking up the CRM…')).toBeInTheDocument();
  });

  it('refuses an address that is already listed', async () => {
    lookupAnswers({
      data: { marketingSuppressionLookup: lookup({ existing: suppressionRow() }) },
      loading: false,
    });
    const { onDone } = renderForm();
    typeInto('Email address', 'gone@acme.io');
    await lookedUp('gone@acme.io');

    await press('Add address');

    expect(
      await screen.findByText('This address is already on the suppression list'),
    ).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('shows the hint of the chosen reason and counts the note', async () => {
    renderForm();

    await chooseOption('Reason', 'Spam complaint');
    fill('Internal note', 'Abuse');

    expect(screen.getByText('The person reported one of your emails as spam.')).toBeInTheDocument();
    expect(
      screen.getByText('Optional context, e.g. a user request or an abuse report. 5/500'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Internal note')).toHaveAttribute('maxLength', '500');
  });

  it('adds the address with its reason, note and archive flag, then closes', async () => {
    const { onDone } = renderForm();
    typeInto('Email address', 'New@Acme.io');
    await chooseOption('Reason', 'Do not contact');
    fill('Internal note', ' legal hold ');
    await userEvent.click(screen.getByRole('switch', { name: 'Archive this address' }));
    await lookedUp('new@acme.io');

    await press('Add address');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          email: 'New@Acme.io',
          reason: SuppressionReason.DoNotContact,
          note: 'legal hold',
          archived: true,
        },
      },
    });
    expect(
      await screen.findByText('new@acme.io added to the suppression list'),
    ).toBeInTheDocument();
  });

  it('keeps the form open and shows the server error when adding fails', async () => {
    gql.create.mockRejectedValue(new Error('Suppression limit reached'));
    const { onDone } = renderForm();
    typeInto('Email address', 'new@acme.io');
    await lookedUp('new@acme.io');

    await press('Add address');

    expect(await screen.findByText('Suppression limit reached')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('falls back to a plain message when the failure is not an Error', async () => {
    gql.create.mockRejectedValue('offline');
    renderForm();
    typeInto('Email address', 'new@acme.io');
    await lookedUp('new@acme.io');

    await press('Add address');

    expect(await screen.findByText('The address could not be added')).toBeInTheDocument();
  });

  it('cancels without saving', async () => {
    const { onCancel } = renderForm();

    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(gql.create).not.toHaveBeenCalled();
  });
});
