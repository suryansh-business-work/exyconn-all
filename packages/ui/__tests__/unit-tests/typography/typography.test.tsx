import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Heading,
  Paragraph,
  Text,
  type HeadingLevel,
  type TextSize,
} from '../../../src/typography';
import { fontWeight } from '../../../src/tokens/typography.token';

describe('Heading', () => {
  it('is an h2 with the h2 variant by default and forwards its ref', () => {
    const ref = createRef<HTMLHeadingElement>();
    render(<Heading ref={ref}>Title</Heading>);
    const heading = screen.getByRole('heading', { level: 2, name: 'Title' });
    expect(heading).toBe(ref.current);
    expect(heading).toHaveClass('MuiTypography-h2');
  });

  it.each<HeadingLevel>([1, 3, 4, 5, 6])(
    'maps level %i to the matching tag and variant',
    (level) => {
      render(<Heading level={level}>Level</Heading>);
      const heading = screen.getByRole('heading', { level, name: 'Level' });
      expect(heading.tagName).toBe(`H${level}`);
      expect(heading).toHaveClass(`MuiTypography-h${level}`);
    },
  );
});

describe('Paragraph', () => {
  it('is a body1 <p> with a bottom margin and forwards its ref', () => {
    const ref = createRef<HTMLParagraphElement>();
    render(<Paragraph ref={ref}>Copy</Paragraph>);
    const p = screen.getByText('Copy');
    expect(p).toBe(ref.current);
    expect(p.tagName).toBe('P');
    expect(p).toHaveClass('MuiTypography-body1');
    expect(p).toHaveStyle({ marginBottom: '16px' });
  });

  it('lets a caller sx object override the margin', () => {
    render(<Paragraph sx={{ marginBottom: '0px' }}>Copy</Paragraph>);
    expect(screen.getByText('Copy')).toHaveStyle({ marginBottom: '0px' });
  });

  it('applies a caller sx array', () => {
    render(<Paragraph sx={[{ color: 'rgb(1, 2, 3)' }, { padding: '2px' }]}>Copy</Paragraph>);
    expect(screen.getByText('Copy')).toHaveStyle({
      color: 'rgb(1, 2, 3)',
      padding: '2px',
      marginBottom: '16px',
    });
  });
});

describe('Text', () => {
  it('is a body1 <span> by default with no weight override, and forwards its ref', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Text ref={ref}>Inline</Text>);
    const text = screen.getByText('Inline');
    expect(text).toBe(ref.current);
    expect(text.tagName).toBe('SPAN');
    expect(text).toHaveClass('MuiTypography-body1');
  });

  it.each<[TextSize, string]>([
    ['sm', 'body2'],
    ['md', 'body1'],
    ['lg', 'subtitle1'],
    ['caption', 'caption'],
    ['overline', 'overline'],
    ['label', 'subtitle2'],
  ])('maps size %s to the %s variant', (size, variant) => {
    render(<Text size={size}>Sized</Text>);
    expect(screen.getByText('Sized')).toHaveClass(`MuiTypography-${variant}`);
  });

  it('takes its weight from the shared font-weight tokens', () => {
    render(<Text weight="semibold">Bold</Text>);
    expect(screen.getByText('Bold')).toHaveStyle({ fontWeight: String(fontWeight.semibold) });
  });

  it('renders as another element when given a component', () => {
    render(<Text component="strong">Strong</Text>);
    expect(screen.getByText('Strong').tagName).toBe('STRONG');
  });

  it('applies a caller sx object after the weight', () => {
    render(
      <Text weight="bold" sx={{ fontWeight: 300 }}>
        Light
      </Text>,
    );
    expect(screen.getByText('Light')).toHaveStyle({ fontWeight: '300' });
  });

  it('applies a caller sx array', () => {
    render(
      <Text weight="medium" sx={[{ padding: '3px' }, { margin: '1px' }]}>
        Many
      </Text>,
    );
    expect(screen.getByText('Many')).toHaveStyle({
      fontWeight: String(fontWeight.medium),
      padding: '3px',
      margin: '1px',
    });
  });
});
