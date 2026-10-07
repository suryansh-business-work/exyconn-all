import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SupportCategory } from '@exyconn/shell/graphql/generated';
import {
  CannedReplyForm,
  type CannedReplyRow,
} from '../../../../../../src/pages/canned-replies/forms/canned-reply';
import { renderWithProviders } from '../../../../test-utils';
import { click, fill, pickOption } from '../../../../form.helpers';
import { cannedReplyRow } from '../../../../fixtures';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateCannedReplyMutation: () => [gql.create],
  useUpdateCannedReplyMutation: () => [gql.update],
}));

const onDone = vi.fn();
const onCancel = vi.fn();

const BODY = 'Could you send a screenshot of the error, please?';

const renderForm = (initial: CannedReplyRow | null = null) =>
  renderWithProviders(<CannedReplyForm initial={initial} onDone={onDone} onCancel={onCancel} />);

const offered = () => screen.getByLabelText('Offer in the composer');

describe('CannedReplyForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({ data: {} });
    gql.update.mockReset().mockResolvedValue({ data: {} });
    onDone.mockReset();
    onCancel.mockReset();
  });

  it('opens a new snippet empty, filed under Other and offered in the composer', () => {
    renderForm();
    expect(screen.getByLabelText('Snippet name')).toHaveValue('');
    expect(screen.getByLabelText('Text')).toHaveValue('');
    expect(screen.getByRole('combobox', { name: /^Category/ })).toHaveTextContent('Other');
    expect(offered()).toBeChecked();
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });

  it('asks for a name that says what the snippet does, and enough text to be worth it', async () => {
    renderForm();
    fill('Snippet name', 'Hi');
    fill('Text', 'Thanks!');
    await click('Create');
    expect(
      await screen.findByText('Name it for what it does — "Ask for a screenshot"'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('A snippet this short is quicker to type than to find'),
    ).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('does not count surrounding spaces towards the name', async () => {
    renderForm();
    fill('Snippet name', '   ab   ');
    fill('Text', BODY);
    await click('Create');
    expect(
      await screen.findByText('Name it for what it does — "Ask for a screenshot"'),
    ).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('creates the snippet trimmed, retired from the composer when switched off', async () => {
    renderForm();
    fill('Snippet name', '  Ask for a screenshot  ');
    await pickOption(/^Category/, 'It');
    fill('Text', `  ${BODY}  `);
    await userEvent.click(offered());
    expect(offered()).not.toBeChecked();
    await click('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          title: 'Ask for a screenshot',
          category: SupportCategory.It,
          body: BODY,
          isActive: false,
        },
      },
    });
    expect(await screen.findByText('Canned reply created')).toBeInTheDocument();
  });

  it('opens a snippet with what it says, then saves it back onto that snippet', async () => {
    const row = cannedReplyRow({ isActive: false });
    renderForm(row);
    expect(screen.getByLabelText('Snippet name')).toHaveValue('Ask for a screenshot');
    expect(screen.getByRole('combobox', { name: /^Category/ })).toHaveTextContent('Hr');
    expect(offered()).not.toBeChecked();

    fill('Text', BODY);
    await click('Update');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'reply-1',
        input: {
          title: row.title,
          category: SupportCategory.Hr,
          body: BODY,
          isActive: false,
        },
      },
    });
    expect(gql.create).not.toHaveBeenCalled();
    expect(await screen.findByText('Canned reply updated')).toBeInTheDocument();
  });

  it('keeps the form open and says why when the save fails', async () => {
    gql.update.mockRejectedValue(new Error('A snippet with that name exists'));
    renderForm(cannedReplyRow());
    await click('Update');

    expect(await screen.findByText('A snippet with that name exists')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel without saving', async () => {
    renderForm();
    await click('Cancel');
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(gql.create).not.toHaveBeenCalled();
  });
});
