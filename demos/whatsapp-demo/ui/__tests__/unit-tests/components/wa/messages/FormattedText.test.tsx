import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { FormattedText } from '../../../../../src/components/wa/messages/FormattedText';

function pieces(text: string): string[] {
  const { container } = render(<FormattedText text={text} />);
  return [...container.querySelectorAll('span')].map((span) => span.textContent ?? '');
}

describe('FormattedText', () => {
  it('keeps plain text, line breaks included, as one piece', () => {
    expect(pieces('Hello there\nSee you soon')).toEqual(['Hello there\nSee you soon']);
  });

  it('applies *bold*, _italic_ and ~strike~, dropping the markers', () => {
    expect(pieces('Hi *Asha*, your _visit_ is ~cancelled~ moved.')).toEqual([
      'Hi ',
      'Asha',
      ', your ',
      'visit',
      ' is ',
      'cancelled',
      ' moved.',
    ]);
  });

  it('handles markup at the very start and end', () => {
    expect(pieces('*Booked* for _today_')).toEqual(['Booked', ' for ', 'today']);
  });

  it('leaves an unclosed marker, or one broken across lines, as typed', () => {
    expect(pieces('Price: 5 * 3\n*draft')).toEqual(['Price: 5 * 3\n*draft']);
  });

  it('renders nothing for empty text', () => {
    expect(pieces('')).toEqual([]);
  });
});
