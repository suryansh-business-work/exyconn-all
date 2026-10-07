import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToolForm, type ToolRow } from '../../../../../../src/pages/website/forms/tool';
import { renderWithProviders } from '../../../../test-utils';
import { field, pickOption } from '../form-helpers';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), categories: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateToolMutation: () => [gql.create],
  useUpdateToolMutation: () => [gql.update],
  useListToolCategoriesQuery: () => gql.categories(),
}));

vi.mock('@exyconn/shell/components/form/rhf', async (importOriginal) => {
  const { BoundFieldStub } = await import('../form-stubs');
  return {
    ...(await importOriginal<typeof import('@exyconn/shell/components/form/rhf')>()),
    RhfRichText: BoundFieldStub,
  };
});

const toolValues = {
  toolCode: 'TL-001',
  categorySlug: 'ai-writing',
  name: 'Headline writer',
  description: 'Writes headlines',
  longDescription: '<p>Long</p>',
  url: '/tools/headline-writer',
  icon: 'title',
  color: '#155dfc',
  features: ['Fast'],
  useCases: ['Blogs'],
  keywords: ['headline'],
  isActive: true,
  isMVP: false,
  order: 3,
};

const tool: ToolRow = { id: 'tool-1', ...toolValues };

function setup(initial: ToolRow | null = null) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(<ToolForm initial={initial} onDone={onDone} onCancel={onCancel} />);
  return { user: userEvent.setup(), onDone, onCancel };
}

describe('ToolForm', () => {
  beforeEach(() => {
    gql.create.mockReset();
    gql.update.mockReset();
    gql.categories.mockReset().mockReturnValue({
      data: {
        listToolCategories: [
          { slug: 'ai-writing', category: 'AI writing' },
          { slug: 'data', category: 'Data tools' },
        ],
      },
    });
  });

  it('creates a tool in a category from the managed list', async () => {
    gql.create.mockResolvedValue({ data: {} });
    const { user, onDone } = setup();

    await user.type(field('Tool code'), 'TL-002');
    await pickOption(user, 'Category', 'Data tools');
    await user.type(field('Name'), 'CSV cleaner');
    await user.type(screen.getByRole('combobox', { name: 'Features' }), 'Dedupe{Enter}');
    await user.click(screen.getByLabelText('MVP'));
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          toolCode: 'TL-002',
          categorySlug: 'data',
          name: 'CSV cleaner',
          description: '',
          longDescription: '',
          url: '',
          icon: '',
          color: '',
          features: ['Dedupe'],
          useCases: [],
          keywords: [],
          isActive: true,
          isMVP: true,
          order: 0,
        },
      },
    });
    expect(await screen.findByText('Tool created')).toBeInTheDocument();
  });

  it('requires a code, a category and a name, even before categories load', async () => {
    gql.categories.mockReturnValue({ data: undefined });
    const { user } = setup();

    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Tool code is required')).toBeInTheDocument();
    expect(screen.getByText('Category is required')).toBeInTheDocument();
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('rejects a URL with spaces and a colour that is not hex', async () => {
    const { user } = setup(tool);

    await user.clear(field('URL'));
    await user.type(field('URL'), 'tools page');
    await user.clear(field('Color'));
    await user.type(field('Color'), '#12');
    await user.click(screen.getByRole('button', { name: 'Update' }));

    expect(
      await screen.findByText('Enter a full URL or a path starting with /'),
    ).toBeInTheDocument();
    expect(screen.getByText('Use a 6-digit hex colour, e.g. #f9851f')).toBeInTheDocument();
    expect(gql.update).not.toHaveBeenCalled();
  });

  it('updates a tool with the values it was opened with', async () => {
    gql.update.mockResolvedValue({ data: {} });
    const { user, onDone } = setup(tool);

    expect(field('Long description')).toHaveValue('<p>Long</p>');
    await user.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({ variables: { id: 'tool-1', input: toolValues } });
    expect(await screen.findByText('Tool updated')).toBeInTheDocument();
  });

  it('shows why the save failed', async () => {
    gql.update.mockRejectedValue(new Error('Tool code already used'));
    const { user, onDone } = setup(tool);

    await user.click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Tool code already used')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });
});
