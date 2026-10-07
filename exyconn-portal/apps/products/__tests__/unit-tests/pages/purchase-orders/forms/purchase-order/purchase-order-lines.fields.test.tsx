import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { PurchaseOrderLinesFields } from '../../../../../../src/pages/purchase-orders/forms/purchase-order';
import { renderWithProviders } from '../../../../test-utils';
import { optionsOf, press, setNumber } from '../../../../form-helpers';

const PRODUCTS = [
  { value: 'product-1', label: 'Widget — WID-1' },
  { value: 'product-2', label: 'Gadget — GAD-2' },
];

/** The lines inside a bare form, started from whatever `lines` value a test gives. */
function Harness({ lines }: Readonly<{ lines?: object[] }>) {
  const methods = useForm<{ lines?: object[] }>({
    defaultValues: lines === undefined ? {} : { lines },
  });
  return (
    <FormProvider {...methods}>
      <PurchaseOrderLinesFields products={PRODUCTS} />
    </FormProvider>
  );
}

const removeButtons = () => screen.queryAllByRole('button', { name: 'Remove line' });

describe('PurchaseOrderLinesFields', () => {
  it('shows no lines and a zero total for a form that has no lines yet', () => {
    renderWithProviders(<Harness />);

    expect(screen.getByText('Lines')).toBeInTheDocument();
    expect(removeButtons()).toHaveLength(0);
    expect(screen.getByText('Total 0')).toBeInTheDocument();
  });

  it('costs a half-filled line as nothing rather than failing', () => {
    renderWithProviders(<Harness lines={[{}]} />);

    expect(removeButtons()).toHaveLength(1);
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('Total 0')).toBeInTheDocument();
  });

  it('adds a line of one unit at no cost', async () => {
    renderWithProviders(<Harness lines={[]} />);

    await press('Add line');

    expect(removeButtons()).toHaveLength(1);
    expect(screen.getByLabelText('Qty')).toHaveValue(1);
    expect(screen.getByLabelText('Unit cost')).toHaveValue(0);
    expect(screen.getByLabelText('Tax %')).toHaveValue(0);
  });

  it('offers the products it was given on each line', async () => {
    renderWithProviders(<Harness lines={[]} />);
    await press('Add line');

    expect(await optionsOf('Product')).toEqual(['Widget — WID-1', 'Gadget — GAD-2']);
  });

  it('recosts a line, tax included, and the total as it is typed', async () => {
    renderWithProviders(<Harness lines={[]} />);
    await press('Add line');

    setNumber('Qty', '2');
    setNumber('Unit cost', '12.5');
    setNumber('Tax %', '10');

    expect(screen.getByText('27.5')).toBeInTheDocument();
    expect(screen.getByText(`Total ${(27.5).toLocaleString()}`)).toBeInTheDocument();
  });

  it('totals every line and drops a removed one from the total', async () => {
    renderWithProviders(
      <Harness
        lines={[
          { productId: 'product-1', quantity: 2, unitCost: 100, taxPercent: 0 },
          { productId: 'product-2', quantity: 1, unitCost: 50, taxPercent: 10 },
        ]}
      />,
    );
    expect(screen.getByText('Total 255')).toBeInTheDocument();

    await userEvent.click(removeButtons()[0]);

    expect(removeButtons()).toHaveLength(1);
    expect(screen.getByText('Total 55')).toBeInTheDocument();
  });
});
