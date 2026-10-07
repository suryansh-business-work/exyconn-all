import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WebsiteChatKnowledgeSource } from '@exyconn/shell/graphql/generated';
import {
  ChatKnowledgeForm,
  chatKnowledgeSchema,
  type ChatKnowledgeRow,
} from '../../../../../../src/pages/chat/forms/chat-knowledge';
import { renderWithProviders } from '../../../../test-utils';
import { knowledgeRow } from '../../chat-fixtures';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateWebsiteChatKnowledgeMutation: () => [gql.create],
  useUpdateWebsiteChatKnowledgeMutation: () => [gql.update],
}));

const onDone = vi.fn();
const onCancel = vi.fn();
const WARNING = /This entry was read from exyconn.com/;

const renderForm = (initial: ChatKnowledgeRow | null = null) =>
  renderWithProviders(<ChatKnowledgeForm initial={initial} onDone={onDone} onCancel={onCancel} />);

const fill = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
const click = (name: string) => userEvent.click(screen.getByRole('button', { name }));

describe('ChatKnowledgeForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({ data: {} });
    gql.update.mockReset().mockResolvedValue({ data: {} });
    onDone.mockReset();
    onCancel.mockReset();
  });

  it('opens a new custom entry empty and usable by the bot', () => {
    renderForm();

    expect(screen.getByLabelText('Title')).toHaveValue('');
    expect(screen.getByLabelText('Link (optional)')).toHaveValue('');
    expect(screen.getByLabelText('Content')).toHaveValue('');
    expect(screen.getByLabelText('The bot may use this')).toBeChecked();
    expect(screen.queryByText(WARNING)).not.toBeInTheDocument();
  });

  it('asks for a title and content', async () => {
    renderForm();
    await click('Create');

    expect(await screen.findByText('Title is required')).toBeInTheDocument();
    expect(screen.getByText('Content is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('wants a full web address for the link', async () => {
    renderForm();
    fill('Title', 'Pricing');
    fill('Content', 'Fixed monthly fee.');
    fill('Link (optional)', 'exyconn.com/pricing');
    await click('Create');

    expect(await screen.findByText('Enter a full link starting with https://')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('creates the entry trimmed, with no link when none is given', async () => {
    renderForm();
    fill('Title', '  Office hours  ');
    fill('Content', '  Mon–Fri, 9 to 6 IST.  ');
    await userEvent.click(screen.getByLabelText('The bot may use this'));
    await click('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          title: 'Office hours',
          url: '',
          content: 'Mon–Fri, 9 to 6 IST.',
          isActive: false,
        },
      },
    });
    expect(await screen.findByText('Knowledge created')).toBeInTheDocument();
  });

  it('warns that a website entry is replaced on the next sync, and still saves it', async () => {
    const row = knowledgeRow({ id: 'kn-7', source: WebsiteChatKnowledgeSource.Website });
    renderForm(row);
    expect(screen.getByText(WARNING)).toBeInTheDocument();
    expect(screen.getByLabelText('Link (optional)')).toHaveValue(row.url);

    await click('Update');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'kn-7',
        input: { title: row.title, url: row.url, content: row.content, isActive: true },
      },
    });
    expect(await screen.findByText('Knowledge updated')).toBeInTheDocument();
  });

  it('shows no warning on the team’s own entries', () => {
    renderForm(knowledgeRow());
    expect(screen.queryByText(WARNING)).not.toBeInTheDocument();
  });

  it('keeps the form open and says why when saving fails', async () => {
    gql.update.mockRejectedValue(new Error('Content is too similar to another entry'));
    renderForm(knowledgeRow());
    await click('Update');

    expect(await screen.findByText('Content is too similar to another entry')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel', async () => {
    renderForm();
    await click('Cancel');
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

describe('chatKnowledgeSchema', () => {
  const valid = { title: 'Pricing', url: '', content: 'Facts.', isActive: true };

  it('keeps titles, links and content within the server’s limits', () => {
    const tooLong = chatKnowledgeSchema.safeParse({
      ...valid,
      title: 't'.repeat(301),
      content: 'c'.repeat(20001),
    });
    const messages = tooLong.error?.issues.map((issue) => issue.message);

    expect(messages).toEqual([
      'Keep the title under 300 characters',
      'Keep the content under 20000 characters',
    ]);
    expect(chatKnowledgeSchema.safeParse({ ...valid, url: 'https://exyconn.com/a' }).success).toBe(
      true,
    );
  });
});
