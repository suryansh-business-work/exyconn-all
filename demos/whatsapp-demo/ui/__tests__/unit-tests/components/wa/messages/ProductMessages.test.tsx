import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { ProductCard } from '../../../../../src/components/wa/messages/ProductCard';
import {
  CarouselMessage,
  ProductMessage,
} from '../../../../../src/components/wa/messages/ProductMessages';
import { renderWithProviders } from '../../../test-utils';
import { frame, option, product, renderMessage } from './messages.fixtures';

describe('ProductCard', () => {
  it('shows the picture, name, subtitle, badge and price in rupees', () => {
    const { container } = renderWithProviders(
      <ProductCard
        product={product({ subtitle: '60 minutes', badge: 'Bestseller' })}
        height="120px"
      />,
    );
    expect(screen.getByRole('img', { name: 'gift' })).toBeInTheDocument();
    expect(container).toHaveTextContent('Bestseller');
    expect(container).toHaveTextContent('Hydra facial60 minutes₹800');
    expect(container).not.toHaveTextContent('off');
  });

  it('strikes the list price and shows the saving when it is higher', () => {
    const { container } = renderWithProviders(<ProductCard product={product({ mrp: 1000 })} />);
    expect(container).toHaveTextContent('₹800₹1,00020% off');
  });

  it('shows no saving when the list price is not higher', () => {
    const { container } = renderWithProviders(<ProductCard product={product({ mrp: 800 })} />);
    expect(container).not.toHaveTextContent('% off');
    expect(container).not.toHaveTextContent('₹800₹800');
  });
});

describe('ProductMessage', () => {
  it('adds the product to the cart from its button, quoting its name', async () => {
    const add = option('add', 'Add to cart');
    const { actions, user } = renderMessage(
      <ProductMessage
        content={{ type: 'product', product: product(), option: add }}
        frame={frame}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Add to cart' }));
    expect(actions.choose).toHaveBeenCalledWith(add, 'Hydra facial');
  });

  it('is just the card when there is nothing to tap', () => {
    renderMessage(
      <ProductMessage content={{ type: 'product', product: product() }} frame={frame} />,
    );
    expect(screen.getByText('Hydra facial')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('CarouselMessage', () => {
  const facial = product();
  const massage = product({ id: 'p-2', title: 'Head massage', price: 500 });
  const pick = option('pick-facial', 'Choose');

  it('scrolls the cards sideways under the intro, each with its own button', async () => {
    const { actions, user } = renderMessage(
      <CarouselMessage
        content={{
          type: 'carousel',
          text: 'Our treatments',
          cards: [{ product: facial, option: pick }, { product: massage }],
        }}
        frame={frame}
      />,
    );
    expect(screen.getByText('Our treatments')).toBeInTheDocument();
    const carousel = screen.getByRole('region', { name: 'Product carousel' });
    expect(carousel).toHaveAttribute('tabindex', '0');
    expect(within(carousel).getByText('Head massage')).toBeInTheDocument();
    expect(within(carousel).getAllByRole('button')).toHaveLength(1);
    await user.click(within(carousel).getByRole('button', { name: 'Choose' }));
    expect(actions.choose).toHaveBeenCalledWith(pick, 'Hydra facial');
  });

  it('shows only the cards when there is no intro', () => {
    const { container } = renderMessage(
      <CarouselMessage
        content={{ type: 'carousel', cards: [{ product: facial }] }}
        frame={frame}
      />,
    );
    expect(container).not.toHaveTextContent('10:30 AM');
    expect(screen.getByText('Hydra facial')).toBeInTheDocument();
  });
});
