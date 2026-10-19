import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  PreferenceCategoryForm,
  toCategoryValues,
  type PreferenceCategoryRow,
} from '../../../../../../src/pages/preferences/forms/preference-category';
import { renderWithProviders } from '../../../../test-utils';
import { fill, press } from '../../../../form-helpers';
import { categoryRow } from '../../preferences.fixtures';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreatePreferenceCategoryMutation: () => [gql.create],
  useUpdatePreferenceCategoryMutation: () => [gql.update],
}));

const ORDER = 'Order on the page';

function renderCategory(initial: PreferenceCategoryRow | null = null) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(
    <PreferenceCategoryForm initial={initial} onDone={onDone} onCancel={onCancel} />,
  );
  return { onDone, onCancel };
}

describe('PreferenceCategoryForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.create.mockResolvedValue({ data: { createPreferenceCategory: categoryRow() } });
    gql.update.mockResolvedValue({ data: { updatePreferenceCategory: categoryRow() } });
  });

  it('starts a new category offered, first on the page', () => {
    renderCategory();

    expect(screen.getByLabelText(/^Category name/)).toHaveValue('');
    expect(screen.getByLabelText(ORDER)).toHaveValue(0);
    expect(screen.getByText('Lower numbers are listed first.')).toBeInTheDocument();
    expect(
      screen.getByRole('switch', { name: 'Offer this category on the preference page' }),
    ).toBeChecked();
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });

  it('creates a category with the trimmed values', async () => {
    const { onDone } = renderCategory();
    fill('Category name *', '  Events ');
    fill('Description', 'Webinars and meetups');
    fill(ORDER, '3');
    await userEvent.click(
      screen.getByRole('switch', { name: 'Offer this category on the preference page' }),
    );

    await press('Create');

    expect(await screen.findByText('Category created')).toBeInTheDocument();
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          name: 'Events',
          description: 'Webinars and meetups',
          isActive: false,
          sortOrder: 3,
        },
      },
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('edits an existing category in place', async () => {
    const { onDone } = renderCategory(categoryRow({ id: 'cat-4', sortOrder: 2 }));

    expect(screen.getByLabelText(/^Category name/)).toHaveValue('Product updates');
    expect(screen.getByLabelText(ORDER)).toHaveValue(2);
    fill('Description', 'Only big launches');
    await press('Update');

    expect(await screen.findByText('Category updated')).toBeInTheDocument();
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'cat-4',
        input: {
          name: 'Product updates',
          description: 'Only big launches',
          isActive: true,
          sortOrder: 2,
        },
      },
    });
    expect(gql.create).not.toHaveBeenCalled();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('needs a name, and caps the name and description', async () => {
    renderCategory();
    await press('Create');
    expect(await screen.findByText('Name the category')).toBeInTheDocument();

    fill('Category name *', 'n'.repeat(81));
    fill('Description', 'd'.repeat(301));
    await press('Create');

    expect(await screen.findByText('Keep the name under 80 characters')).toBeInTheDocument();
    expect(screen.getByText('Keep the description under 300 characters')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it.each([
    ['-1', 'Use 0 or more'],
    ['1000', 'Use 999 or less'],
    ['1.5', 'Use a whole number'],
  ])('rejects the order %s', async (order, message) => {
    renderCategory();
    fill('Category name *', 'Events');
    fill(ORDER, order);

    await press('Create');

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.queryByText('Lower numbers are listed first.')).not.toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('accepts the highest order', async () => {
    renderCategory();
    fill('Category name *', 'Events');
    fill(ORDER, '999');

    await press('Create');

    expect(await screen.findByText('Category created')).toBeInTheDocument();
    expect(gql.create).toHaveBeenCalledWith({
      variables: { input: { name: 'Events', description: '', isActive: true, sortOrder: 999 } },
    });
  });

  it('reports a failed save and keeps the form open', async () => {
    gql.create.mockRejectedValue(new Error('A category with that name exists'));
    const { onDone } = renderCategory();
    fill('Category name *', 'Events');

    await press('Create');

    expect(await screen.findByText('A category with that name exists')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('hands Cancel back to the page', async () => {
    const { onCancel } = renderCategory();

    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

describe('toCategoryValues', () => {
  it('fills a new category with defaults', () => {
    expect(toCategoryValues(null)).toEqual({
      name: '',
      description: '',
      isActive: true,
      sortOrder: 0,
    });
  });

  it('copies the editable fields of a row', () => {
    expect(toCategoryValues(categoryRow({ isActive: false, sortOrder: 9 }))).toEqual({
      name: 'Product updates',
      description: 'Launches and new features',
      isActive: false,
      sortOrder: 9,
    });
  });
});
