import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatFaqForm, type ChatFaqRow } from '../../../../../../src/pages/chat/forms/chat-faq';
import { renderWithProviders } from '../../../../test-utils';
import { faqRow } from '../../chat-fixtures';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateWebsiteChatFaqMutation: () => [gql.create],
  useUpdateWebsiteChatFaqMutation: () => [gql.update],
}));

const onDone = vi.fn();
const onCancel = vi.fn();

const renderForm = (initial: ChatFaqRow | null = null) =>
  renderWithProviders(<ChatFaqForm initial={initial} onDone={onDone} onCancel={onCancel} />);

const fill = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
const click = (name: string) => userEvent.click(screen.getByRole('button', { name }));
const shown = () => screen.getByLabelText('Show in the chat widget');

describe('ChatFaqForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({ data: {} });
    gql.update.mockReset().mockResolvedValue({ data: {} });
    onDone.mockReset();
    onCancel.mockReset();
  });

  it('opens a new FAQ empty, first in the list and shown in the widget', () => {
    renderForm();

    expect(screen.getByLabelText('Question')).toHaveValue('');
    expect(screen.getByLabelText('Answer')).toHaveValue('');
    expect(screen.getByLabelText('Order')).toHaveValue(0);
    expect(shown()).toBeChecked();
    expect(screen.getByText('Lower numbers appear first in the widget.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });

  it('asks for a question and an answer', async () => {
    renderForm();
    fill('Question', '   ');
    await click('Create');

    expect(await screen.findByText('Question is required')).toBeInTheDocument();
    expect(screen.getByText('Answer is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('keeps the question and answer within the server’s limits', async () => {
    renderForm();
    fill('Question', 'q'.repeat(301));
    fill('Answer', 'a'.repeat(2001));
    await click('Create');

    expect(await screen.findByText('Keep the question under 300 characters')).toBeInTheDocument();
    expect(screen.getByText('Keep the answer under 2000 characters')).toBeInTheDocument();
  });

  it('wants a whole, non-negative order', async () => {
    renderForm();
    fill('Order', '-1');
    await click('Create');
    expect(await screen.findByText('Order must be 0 or more')).toBeInTheDocument();

    fill('Order', '1.5');
    expect(await screen.findByText('Order must be a whole number')).toBeInTheDocument();
  });

  it('creates the FAQ trimmed, with the order as a number', async () => {
    renderForm();
    fill('Question', '  Where are you based?  ');
    fill('Answer', '  Bengaluru and remote.  ');
    fill('Order', '3');
    await userEvent.click(shown());
    await click('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          question: 'Where are you based?',
          answer: 'Bengaluru and remote.',
          sortOrder: 3,
          isActive: false,
        },
      },
    });
    expect(await screen.findByText('FAQ created')).toBeInTheDocument();
  });

  it('opens an FAQ with what it says and saves it back onto that FAQ', async () => {
    const row = faqRow({ isActive: false });
    renderForm(row);
    expect(screen.getByLabelText('Question')).toHaveValue(row.question);
    expect(screen.getByLabelText('Order')).toHaveValue(2);
    expect(shown()).not.toBeChecked();

    await click('Update');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'faq-1',
        input: { question: row.question, answer: row.answer, sortOrder: 2, isActive: false },
      },
    });
    expect(await screen.findByText('FAQ updated')).toBeInTheDocument();
  });

  it('keeps the form open and says why when saving fails', async () => {
    gql.update.mockRejectedValue(new Error('That question already exists'));
    renderForm(faqRow());
    await click('Update');

    expect(await screen.findByText('That question already exists')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel without saving', async () => {
    renderForm();
    await click('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(gql.create).not.toHaveBeenCalled();
  });
});
