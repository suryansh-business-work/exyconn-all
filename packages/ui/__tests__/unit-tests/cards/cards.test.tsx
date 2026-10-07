import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardFooter, CardHeader } from '../../../src/cards';
import { CARD_RADIUS } from '../../../src/tokens/border.token';

describe('Card', () => {
  it('takes the card corner and forwards its ref and props', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Card ref={ref} data-testid="card" variant="outlined">
        Body
      </Card>,
    );
    const card = screen.getByTestId('card');
    expect(card).toBe(ref.current);
    expect(card).toHaveClass('MuiCard-root', 'MuiPaper-outlined');
    expect(card).toHaveStyle({ borderRadius: `${CARD_RADIUS}px` });
  });

  it('applies a caller sx object after the corner, so the caller wins', () => {
    render(
      <Card data-testid="card" sx={{ borderRadius: '9px', padding: '3px' }}>
        Body
      </Card>,
    );
    expect(screen.getByTestId('card')).toHaveStyle({ borderRadius: '9px', padding: '3px' });
  });

  it('applies every entry of a caller sx array', () => {
    render(
      <Card data-testid="card" sx={[{ padding: '5px' }, { margin: '6px' }]}>
        Body
      </Card>,
    );
    expect(screen.getByTestId('card')).toHaveStyle({
      borderRadius: `${CARD_RADIUS}px`,
      padding: '5px',
      margin: '6px',
    });
  });
});

describe('CardFooter', () => {
  it('pads its actions by default and forwards its ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(<CardFooter ref={ref}>Actions</CardFooter>);
    const footer = screen.getByText('Actions');
    expect(footer).toBe(ref.current);
    expect(footer).toHaveClass('MuiCardActions-root');
    expect(footer).toHaveStyle({
      paddingLeft: '16px',
      paddingRight: '16px',
      paddingBottom: '16px',
    });
  });

  it('lets a caller sx object override the default padding', () => {
    render(<CardFooter sx={{ paddingBottom: '1px' }}>Actions</CardFooter>);
    expect(screen.getByText('Actions')).toHaveStyle({ paddingBottom: '1px', paddingLeft: '16px' });
  });

  it('applies a caller sx array', () => {
    render(<CardFooter sx={[{ paddingLeft: '2px' }, { margin: '4px' }]}>Actions</CardFooter>);
    expect(screen.getByText('Actions')).toHaveStyle({ paddingLeft: '2px', margin: '4px' });
  });
});

describe('CardHeader', () => {
  it('renders its title and subheader and forwards its ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(<CardHeader ref={ref} title="Revenue" subheader="This month" />);
    expect(ref.current).toHaveClass('MuiCardHeader-root');
    expect(ref.current).toHaveTextContent('Revenue');
    expect(screen.getByText('This month')).toBeInTheDocument();
  });
});
