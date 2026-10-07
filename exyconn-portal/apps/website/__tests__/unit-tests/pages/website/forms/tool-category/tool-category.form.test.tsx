import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ToolCategoryForm,
  type ToolCategoryRow,
} from '../../../../../../src/pages/website/forms/tool-category';
import { renderWithProviders } from '../../../../test-utils';
import { field } from '../form-helpers';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateToolCategoryMutation: () => [gql.create],
  useUpdateToolCategoryMutation: () => [gql.update],
}));

const categoryValues = {
  slug: 'ai-writing',
  category: 'AI writing',
  description: 'Write faster',
  icon: 'edit',
  color: '#f9851f',
  isActive: true,
  order: 1,
};

const category: ToolCategoryRow = { id: 'cat-1', ...categoryValues };

function setup(initial: ToolCategoryRow | null = null) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(<ToolCategoryForm initial={initial} onDone={onDone} onCancel={onCancel} />);
  return { user: userEvent.setup(), onDone, onCancel };
}

describe('ToolCategoryForm', () => {
  beforeEach(() => {
    gql.create.mockReset();
    gql.update.mockReset();
  });

  it('creates an active category with no colour', async () => {
    gql.create.mockResolvedValue({ data: {} });
    const { user, onDone } = setup();

    await user.type(field('Slug'), 'data-tools');
    await user.type(field('Category'), 'Data tools');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          slug: 'data-tools',
          category: 'Data tools',
          description: '',
          icon: '',
          color: '',
          isActive: true,
          order: 0,
        },
      },
    });
    expect(await screen.findByText('Tool category created')).toBeInTheDocument();
  });

  it('requires a slug and a category name', async () => {
    const { user } = setup();

    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Slug is required')).toBeInTheDocument();
    expect(screen.getByText('Category is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('rejects a slug with capitals, a named colour and a negative order', async () => {
    const { user } = setup(category);

    await user.clear(field('Slug'));
    await user.type(field('Slug'), 'AI Writing');
    await user.clear(field('Color'));
    await user.type(field('Color'), 'orange');
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Order' }), {
      target: { value: '-3' },
    });
    await user.click(screen.getByRole('button', { name: 'Update' }));

    expect(
      await screen.findByText('Lower-case letters, numbers and hyphens only'),
    ).toBeInTheDocument();
    expect(screen.getByText('Use a 6-digit hex colour, e.g. #f9851f')).toBeInTheDocument();
    expect(screen.getByText('Must be ≥ 0')).toBeInTheDocument();
    expect(gql.update).not.toHaveBeenCalled();
  });

  it('updates a category, hiding it and moving it down', async () => {
    gql.update.mockResolvedValue({ data: {} });
    const { user, onDone } = setup(category);

    await user.click(screen.getByLabelText('Active'));
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Order' }), {
      target: { value: '4' },
    });
    await user.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: { id: 'cat-1', input: { ...categoryValues, isActive: false, order: 4 } },
    });
    expect(await screen.findByText('Tool category updated')).toBeInTheDocument();
  });

  it('shows why the save failed', async () => {
    gql.update.mockRejectedValue(new Error('Slug already used'));
    const { user, onDone } = setup(category);

    await user.click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Slug already used')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });
});
