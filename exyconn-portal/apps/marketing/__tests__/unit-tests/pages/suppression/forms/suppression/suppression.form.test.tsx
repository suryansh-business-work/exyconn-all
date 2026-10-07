import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { SuppressionReason } from '@exyconn/shell/graphql/generated';
import {
  SuppressionForm,
  type SuppressionRow,
} from '../../../../../../src/pages/suppression/forms/suppression';
import { renderWithProviders } from '../../../../test-utils';
import { suppressionRow } from '../../../../fixtures';
import { chooseOption, fill, press } from '../../../../form-helpers';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateMarketingSuppressionMutation: () => [gql.create],
  useUpdateMarketingSuppressionMutation: () => [gql.update],
}));

function renderForm(initial: SuppressionRow | null = null) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(<SuppressionForm initial={initial} onDone={onDone} onCancel={onCancel} />);
  return { onDone, onCancel };
}

describe('SuppressionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.create.mockResolvedValue({ data: { createMarketingSuppression: { id: 'suppression-9' } } });
    gql.update.mockResolvedValue({ data: { updateMarketingSuppression: { id: 'suppression-1' } } });
  });

  it('requires an email', async () => {
    renderForm();

    await press('Create');

    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('refuses a malformed email and an over-long note', async () => {
    renderForm();
    fill('Email', 'gone.acme.io');
    fill('Note', 'x'.repeat(201));

    await press('Create');

    expect(await screen.findByText('Enter a valid email')).toBeInTheDocument();
    expect(screen.getByText('Keep the note under 200 characters')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('adds an address by hand, trimmed, with the reason chosen', async () => {
    const { onDone } = renderForm();
    fill('Email', '  gone@acme.io ');
    await chooseOption('Reason', 'Bounced');
    fill('Note', 'Partner list');

    await press('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: { email: 'gone@acme.io', reason: SuppressionReason.Bounced, source: 'Partner list' },
      },
    });
    expect(await screen.findByText('Suppression created')).toBeInTheDocument();
  });

  it('starts a new address as added by hand', () => {
    renderForm();

    expect(screen.getByRole('combobox', { name: /^Reason/ })).toHaveTextContent('Manual');
  });

  it('updates an existing row by id, keeping its values', async () => {
    const { onDone } = renderForm(suppressionRow({ id: 'suppression-1' }));

    expect(screen.getByLabelText('Email')).toHaveValue('gone@acme.io');
    await press('Update');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'suppression-1',
        input: {
          email: 'gone@acme.io',
          reason: SuppressionReason.Unsubscribed,
          source: 'Footer link',
        },
      },
    });
  });

  it('keeps the form open and reports a failed save', async () => {
    gql.create.mockRejectedValueOnce(new Error('Already suppressed'));
    const { onDone } = renderForm();
    fill('Email', 'gone@acme.io');

    await press('Create');

    expect(await screen.findByText('Already suppressed')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });
});
