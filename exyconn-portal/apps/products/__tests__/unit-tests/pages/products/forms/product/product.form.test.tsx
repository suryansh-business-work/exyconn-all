import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { ProductStatus } from '@exyconn/shell/graphql/generated';
import { ProductForm, type ProductRow } from '../../../../../../src/pages/products/forms/product';
import { renderWithProviders } from '../../../../test-utils';
import { productRow } from '../../../../fixtures';
import { chooseOption, fillField, optionsOf, press, setNumber } from '../../../../form-helpers';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateProductMutation: () => [gql.create],
  useUpdateProductMutation: () => [gql.update],
}));

function renderForm(initial: ProductRow | null = null) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(<ProductForm initial={initial} onDone={onDone} onCancel={onCancel} />);
  return { onDone, onCancel };
}

async function fillRequired() {
  await fillField('Name', 'Gadget');
  await fillField('SKU', 'GAD-2');
  await fillField('Category', 'Hardware');
}

describe('ProductForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.create.mockResolvedValue({ data: { createProduct: { id: 'product-9' } } });
    gql.update.mockResolvedValue({ data: { updateProduct: { id: 'product-1' } } });
  });

  it('requires a name, a SKU and a category', async () => {
    renderForm();

    await press('Create');

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('SKU is required')).toBeInTheDocument();
    expect(screen.getByText('Category is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('treats a name of only spaces as missing', async () => {
    renderForm();
    await fillRequired();
    await fillField('Name', '   ');

    await press('Create');

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('rejects a negative price and part units of stock', async () => {
    renderForm();
    await fillRequired();
    setNumber('Price', '-1');
    setNumber('Opening stock', '2.5');
    setNumber('Reorder level', '-3');

    await press('Create');

    expect(await screen.findAllByText('Must be ≥ 0')).toHaveLength(2);
    expect(screen.getByText('Whole number')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('offers every product status in words', async () => {
    renderForm();

    expect(await optionsOf('Status')).toEqual(['Active', 'Archived', 'Draft']);
  });

  it('creates a draft with its opening stock and the default reorder level', async () => {
    const { onDone } = renderForm();
    await fillRequired();
    setNumber('Price', '19.99');
    setNumber('Opening stock', '40');

    await press('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          name: 'Gadget',
          sku: 'GAD-2',
          price: 19.99,
          category: 'Hardware',
          stock: 40,
          reorderLevel: 5,
          status: ProductStatus.Draft,
        },
      },
    });
    expect(await screen.findByText('Product created')).toBeInTheDocument();
  });

  it('edits without the opening stock and never sends a stock level', async () => {
    const { onDone } = renderForm(productRow({ id: 'product-1', reorderLevel: 8 }));

    expect(screen.getByLabelText('Name')).toHaveValue('Widget');
    expect(screen.queryByLabelText('Opening stock')).not.toBeInTheDocument();
    await chooseOption('Status', 'Archived');
    await press('Update');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'product-1',
        input: {
          name: 'Widget',
          sku: 'WID-1',
          price: 250,
          category: 'Hardware',
          reorderLevel: 8,
          status: ProductStatus.Archived,
        },
      },
    });
    expect(await screen.findByText('Product updated')).toBeInTheDocument();
  });

  it('keeps the form open and shows why a save failed', async () => {
    gql.update.mockRejectedValueOnce(new Error('SKU WID-1 is taken'));
    const { onDone } = renderForm(productRow());

    await press('Update');

    expect(await screen.findByText('SKU WID-1 is taken')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('cancels without saving', async () => {
    const { onCancel } = renderForm();

    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(gql.create).not.toHaveBeenCalled();
  });
});
