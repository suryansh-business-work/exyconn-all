import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  SupportCategory,
  useCreateKbArticleMutation,
  useUpdateKbArticleMutation,
} from '@/graphql/generated';
import { KbArticleForm, type KbArticleRow } from '@/pages/content-forms';
import { renderWithProviders } from '../../test-utils';
import { mutationTuple } from '../hookMocks';

vi.mock('@/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/graphql/generated')>()),
  useCreateKbArticleMutation: vi.fn(),
  useUpdateKbArticleMutation: vi.fn(),
}));

const create = vi.fn();
const update = vi.fn();
const BODY = 'Restart the VPN client, then sign in again with your portal account.';

const article: KbArticleRow = {
  id: 'kb-1',
  title: 'Reset the VPN',
  slug: 'reset-vpn',
  category: SupportCategory.It,
  summary: 'When the VPN will not connect',
  body: BODY,
  isPublished: true,
  updatedByName: 'Asha Rao',
  updatedAt: '2026-05-01T00:00:00.000Z',
};

function renderForm(initial: KbArticleRow | null, categories?: readonly SupportCategory[]) {
  const onDone = vi.fn();
  renderWithProviders(
    <KbArticleForm initial={initial} onDone={onDone} onCancel={vi.fn()} categories={categories} />,
  );
  return onDone;
}

async function enter(label: string, value: string) {
  const input = screen.getByRole('textbox', { name: label });
  await userEvent.clear(input);
  await userEvent.click(input);
  await userEvent.paste(value);
}

beforeEach(() => {
  create.mockReset().mockResolvedValue({ data: {} });
  update.mockReset().mockResolvedValue({ data: {} });
  vi.mocked(useCreateKbArticleMutation).mockReturnValue(mutationTuple(create) as never);
  vi.mocked(useUpdateKbArticleMutation).mockReturnValue(mutationTuple(update) as never);
});

describe('KbArticleForm', () => {
  it('files a new article under Other when every category is offered', () => {
    renderForm(null);
    expect(screen.getByRole('combobox', { name: 'Category' })).toHaveTextContent('Other');
  });

  it("files it under the screen's first category when Other is not offered", () => {
    renderForm(null, [SupportCategory.It, SupportCategory.Hr]);
    expect(screen.getByRole('combobox', { name: 'Category' })).toHaveTextContent('It');
  });

  it('explains every rule an article breaks', async () => {
    renderForm(null);
    await enter('Title', 'VPN');
    await enter('Slug', 'Bad Slug');
    await enter('Summary', 'x'.repeat(201));
    await enter('Answer', 'Too short');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(
      await screen.findByText('Give the article a title somebody could search for'),
    ).toBeInTheDocument();
    expect(screen.getByText('Lowercase letters, digits and hyphens only')).toBeInTheDocument();
    expect(screen.getByText('Keep the summary to one line')).toBeInTheDocument();
    expect(screen.getByText('An answer this short will not help anybody')).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });

  it('wants a slug of at least three characters', async () => {
    renderForm(null);
    await enter('Slug', 'ab');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByText('Slug must be at least 3 characters')).toBeInTheDocument();
  });

  it('creates an article as a draft by default', async () => {
    const onDone = renderForm(null);
    await enter('Title', 'Reset the VPN');
    await enter('Slug', 'reset-vpn');
    await enter('Answer', BODY);
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Article created')).toBeInTheDocument();
    expect(create).toHaveBeenCalledWith({
      variables: {
        input: {
          title: 'Reset the VPN',
          slug: 'reset-vpn',
          category: SupportCategory.Other,
          summary: '',
          body: BODY,
          isPublished: false,
        },
      },
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('updates an existing article with its own values', async () => {
    const onDone = renderForm(article);
    expect(screen.getByRole('switch', { name: 'Published' })).toBeChecked();
    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Article updated')).toBeInTheDocument();
    expect(update).toHaveBeenCalledWith({
      variables: {
        id: 'kb-1',
        input: {
          title: 'Reset the VPN',
          slug: 'reset-vpn',
          category: SupportCategory.It,
          summary: 'When the VPN will not connect',
          body: BODY,
          isPublished: true,
        },
      },
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
