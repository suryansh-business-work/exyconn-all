import { fireEvent, screen } from '@testing-library/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { FieldValues, Resolver } from 'react-hook-form';
import { NumberField } from '../../../../../../../src/admin/workflows/editor/inspector/fields/NumberField';
import { renderField, replaceText, submitted } from '../node-form-helpers';

describe('NumberField', () => {
  it('stores what is typed as a number, with the step and hint', async () => {
    const { user, onSubmit, submit } = renderField(
      <NumberField name="ms" label="Typing time (ms)" step={100} hint="100 to 60,000" />,
      { ms: 1000 },
    );
    const field = screen.getByRole('spinbutton', { name: 'Typing time (ms)' });
    expect(field).toHaveValue(1000);
    expect(field).toHaveAttribute('step', '100');
    expect(field).toHaveAttribute('inputmode', 'decimal');
    expect(screen.getByText('100 to 60,000')).toBeInTheDocument();
    await user.clear(field);
    expect(field).toHaveValue(null);
    await user.type(field, '2500');
    await submit();
    expect((await submitted(onSubmit)).ms).toBe(2500);
  });

  it('stores an emptied field as not set', async () => {
    const { user, onSubmit, submit } = renderField(<NumberField name="mrp" label="MRP" />, {
      mrp: 10,
    });
    const field = screen.getByRole('spinbutton', { name: 'MRP' });
    await user.clear(field);
    expect(field).toHaveValue(null);
    await submit();
    expect((await submitted(onSubmit)).mrp).toBeUndefined();
  });

  it('stores non-numeric text as NaN so the schema rejects it', async () => {
    const { onSubmit, submit } = renderField(<NumberField name="pages" label="Pages" />, {
      pages: 1,
    });
    const field = screen.getByRole('spinbutton', { name: 'Pages' });
    // A number input sanitises letters away in jsdom; report raw text as some browsers do.
    Object.defineProperty(field, 'value', {
      configurable: true,
      get: () => 'abc',
      set: () => undefined,
    });
    fireEvent.change(field);
    await submit();
    expect((await submitted(onSubmit)).pages).toBeNaN();
  });

  it('keeps a template as text when templates are allowed, and numbers as numbers', async () => {
    const { user, onSubmit, submit } = renderField(
      <NumberField name="price" label="Price" allowTemplate />,
      { price: 499 },
    );
    const field = screen.getByRole('textbox', { name: 'Price' });
    expect(field).toHaveAttribute('inputmode', 'text');
    await replaceText(user, field, '{{fee}}');
    await submit();
    expect((await submitted(onSubmit)).price).toBe('{{fee}}');
    await replaceText(user, field, ' 650 ');
    await submit();
    expect((await submitted(onSubmit, 2)).price).toBe(650);
  });

  it('shows the validation error instead of the hint', async () => {
    const resolver = zodResolver(
      z.object({ qty: z.number('Enter a quantity').min(1) }),
    ) as unknown as Resolver<FieldValues>;
    const { submit } = renderField(
      <NumberField name="qty" label="Quantity" hint="How many" />,
      {},
      { resolver },
    );
    expect(screen.getByRole('spinbutton', { name: 'Quantity' })).toHaveValue(null);
    await submit();
    expect(await screen.findByText('Enter a quantity')).toBeInTheDocument();
    expect(screen.queryByText('How many')).toBeNull();
  });
});
