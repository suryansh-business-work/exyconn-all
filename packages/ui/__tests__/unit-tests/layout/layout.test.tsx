import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Container, Flex, Section } from '../../../src/layout';

describe('Container', () => {
  it('defaults to the lg max width and forwards its ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Container ref={ref}>Page</Container>);
    expect(screen.getByText('Page')).toBe(ref.current);
    expect(ref.current).toHaveClass('MuiContainer-maxWidthLg');
  });

  it('takes a caller max width', () => {
    render(<Container maxWidth="sm">Page</Container>);
    const page = screen.getByText('Page');
    expect(page).toHaveClass('MuiContainer-maxWidthSm');
    expect(page).not.toHaveClass('MuiContainer-maxWidthLg');
  });
});

describe('Section', () => {
  it('is a <section> with default vertical padding', () => {
    const ref = createRef<HTMLElement>();
    render(<Section ref={ref}>Block</Section>);
    const section = screen.getByText('Block');
    expect(section).toBe(ref.current);
    expect(section.tagName).toBe('SECTION');
    expect(section).toHaveStyle({ paddingTop: '32px', paddingBottom: '32px' });
  });

  it('lets a caller sx object win over the default padding', () => {
    render(<Section sx={{ paddingTop: '1px' }}>Block</Section>);
    expect(screen.getByText('Block')).toHaveStyle({ paddingTop: '1px', paddingBottom: '32px' });
  });

  it('applies a caller sx array', () => {
    render(<Section sx={[{ paddingBottom: '2px' }, { margin: '3px' }]}>Block</Section>);
    expect(screen.getByText('Block')).toHaveStyle({ paddingBottom: '2px', margin: '3px' });
  });
});

describe('Flex', () => {
  it('is a row by default with no wrapping', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Flex ref={ref}>Row</Flex>);
    const row = screen.getByText('Row');
    expect(row).toBe(ref.current);
    expect(row).toHaveStyle({ display: 'flex', flexDirection: 'row' });
    expect(row.style.flexWrap).toBe('');
    expect(getComputedStyle(row).flexWrap).not.toBe('wrap');
  });

  it('turns its alignment props into styles', () => {
    render(
      <Flex
        direction="column"
        alignItems="center"
        justifyContent="space-between"
        flexGrow={1}
        gap="7px"
      >
        Col
      </Flex>,
    );
    expect(screen.getByText('Col')).toHaveStyle({
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexGrow: '1',
      gap: '7px',
    });
  });

  it('wraps when asked to', () => {
    render(<Flex wrap>Wrapped</Flex>);
    expect(screen.getByText('Wrapped')).toHaveStyle({ flexWrap: 'wrap' });
  });

  it('prefers an explicit flexWrap over the wrap shorthand', () => {
    render(
      <Flex wrap flexWrap="wrap-reverse">
        Reverse
      </Flex>,
    );
    expect(screen.getByText('Reverse')).toHaveStyle({ flexWrap: 'wrap-reverse' });
  });

  it('applies a caller sx object after its own props, so the caller wins', () => {
    render(
      <Flex alignItems="center" sx={{ alignItems: 'flex-end' }}>
        Override
      </Flex>,
    );
    expect(screen.getByText('Override')).toHaveStyle({ alignItems: 'flex-end' });
  });

  it('applies every entry of a caller sx array', () => {
    render(<Flex sx={[{ padding: '4px' }, { margin: '5px' }]}>Many</Flex>);
    expect(screen.getByText('Many')).toHaveStyle({ padding: '4px', margin: '5px' });
  });
});
