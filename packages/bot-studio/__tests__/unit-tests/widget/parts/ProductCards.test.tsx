import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductCard, ProductCarousel } from '../../../../src/widget/parts/ProductCards';
import { option, product, renderPart } from '../widget.fixtures';

describe('ProductCard', () => {
  it('shows the artwork, badge, subtitle, price, the struck MRP and its button', async () => {
    const buy = option('buy', 'Add to cart');
    const shoes = product({ subtitle: 'Size 9', badge: 'New', mrp: 2999 });
    const { actions } = renderPart(<ProductCard product={shoes} option={buy} />);
    expect(screen.getByRole('img', { name: 'bag' })).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('Running shoes')).toBeInTheDocument();
    expect(screen.getByText('Size 9')).toBeInTheDocument();
    expect(screen.getByText(/2,499/)).toBeInTheDocument();
    const was = screen.getByLabelText(/^Was .*2,999/);
    expect(was).toHaveStyle({ textDecoration: 'line-through' });
    await userEvent.click(screen.getByRole('button', { name: 'Add to cart' }));
    expect(actions.choose).toHaveBeenCalledWith(buy, 'Running shoes');
  });

  it('strikes no MRP that is not above the price, and has no extras it was not given', () => {
    renderPart(<ProductCard product={product({ mrp: 2499 })} />);
    expect(screen.queryByLabelText(/^Was /)).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getAllByText(/2,499/)).toHaveLength(1);
  });

  it('strikes no MRP when there is none', () => {
    renderPart(<ProductCard product={product()} />);
    expect(screen.queryByLabelText(/^Was /)).not.toBeInTheDocument();
  });
});

describe('ProductCarousel', () => {
  it('lists every card in a scrollable, focusable region after its intro text', () => {
    renderPart(
      <ProductCarousel
        text="Our picks"
        cards={[
          { product: product({ id: 'a', title: 'Shoes' }), option: option('buy-a', 'Buy') },
          { product: product({ id: 'b', title: 'Socks' }) },
        ]}
      />,
    );
    expect(screen.getByText('Our picks')).toBeInTheDocument();
    const region = screen.getByRole('region', { name: 'Products' });
    expect(region).toHaveAttribute('tabindex', '0');
    const items = within(region).getAllByRole('listitem');
    expect(items.map((item) => within(item).getByText(/Shoes|Socks/).textContent)).toEqual([
      'Shoes',
      'Socks',
    ]);
    expect(within(items[0]).getByRole('button', { name: 'Buy' })).toBeInTheDocument();
    expect(within(items[1]).queryByRole('button')).not.toBeInTheDocument();
  });

  it('starts straight with the cards when there is no intro text', () => {
    const { container } = renderPart(<ProductCarousel cards={[{ product: product() }]} />);
    const region = screen.getByRole('region', { name: 'Products' });
    expect(container.firstElementChild?.firstElementChild).toBe(region);
  });
});
