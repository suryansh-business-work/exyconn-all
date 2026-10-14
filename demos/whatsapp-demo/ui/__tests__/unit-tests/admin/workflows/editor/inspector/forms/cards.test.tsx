import { screen } from '@testing-library/react';
import { applyForm, makeNode, renderNodeForm, replaceText } from '../node-form-helpers';

const textbox = (name: string) => screen.getByRole('textbox', { name });
const IMAGE = { icon: 'bag', accent: 'teal' };

describe('Product form', () => {
  it('edits one product card and its optional button', async () => {
    const { user, onApply } = renderNodeForm(makeNode('product'));
    expect(
      screen.getByText('With a button the card gets its own output; without, it continues to Next'),
    ).toBeInTheDocument();
    expect(textbox('Price (₹)')).toHaveValue('499');
    await user.type(textbox('Badge'), 'New');
    await user.type(textbox('Button title'), 'Buy');
    await replaceText(user, textbox('MRP (₹)'), '599');
    expect(await applyForm(user, onApply)).toEqual({
      product: {
        id: 'product-1',
        title: 'Product',
        price: 499,
        mrp: 599,
        badge: 'New',
        image: IMAGE,
        buttonTitle: 'Buy',
      },
    });
  });

  it('takes a {{var}} price and rejects an empty one', async () => {
    // A price is `number | template`; an empty one fails both and the form says it is required.
    const { user, onApply } = renderNodeForm(makeNode('product'));
    await user.clear(textbox('Price (₹)'));
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(await screen.findByText('This is required')).toBeInTheDocument();
    expect(onApply).not.toHaveBeenCalled();
    await replaceText(user, textbox('Price (₹)'), '{{fee}}');
    const data = (await applyForm(user, onApply)) as { product: { price: unknown } };
    expect(data.product.price).toBe('{{fee}}');
  });
});

describe('Carousel form', () => {
  it('adds a card that can be picked straight away', async () => {
    const { user, onApply } = renderNodeForm(makeNode('carousel'));
    expect(screen.getByText('(1/10)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Card 1' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Add' }));
    expect(screen.getAllByText('Cards without a button cannot be picked')).toHaveLength(2);
    expect(screen.getAllByRole('textbox', { name: 'Id' })[1]).toHaveValue('card-2');
    expect(screen.getAllByRole('textbox', { name: 'Button title' })[1]).toHaveValue('Select');
    await user.type(screen.getAllByRole('textbox', { name: 'Title' })[1], 'Gift box');
    await user.type(screen.getAllByRole('textbox', { name: 'Subtitle' })[1], 'Wrapped');
    await user.click(screen.getAllByRole('button', { name: 'Add variable' })[1]);
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'item');
    await user.type(screen.getByRole('textbox', { name: 'Value' }), 'gift');
    expect(await applyForm(user, onApply)).toEqual({
      text: 'Here is what we have.',
      cards: [
        { id: 'card-1', title: 'Product', price: 499, image: IMAGE, buttonTitle: 'Select' },
        {
          id: 'card-2',
          title: 'Gift box',
          subtitle: 'Wrapped',
          price: 0,
          image: IMAGE,
          buttonTitle: 'Select',
          set: { item: 'gift' },
        },
      ],
    });
  });
});
