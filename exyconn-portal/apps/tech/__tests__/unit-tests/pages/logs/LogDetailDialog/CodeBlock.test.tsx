import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { CodeBlock } from '../../../../../src/pages/logs/LogDetailDialog/CodeBlock';
import { renderWithProviders } from '../../../test-utils';

describe('CodeBlock', () => {
  it('shows a titled, preformatted block keeping the text’s line breaks', () => {
    renderWithProviders(<CodeBlock title="Stack" text={'Error: boom\n    at App.tsx:3'} />);

    expect(screen.getByText('Stack')).toBeInTheDocument();
    const block = screen.getByText(/Error: boom/);
    expect(block.tagName).toBe('PRE');
    expect(block.textContent).toBe('Error: boom\n    at App.tsx:3');
  });

  it('renders nothing at all for empty text', () => {
    renderWithProviders(<CodeBlock title="Context" text="" />);

    expect(screen.queryByText('Context')).not.toBeInTheDocument();
  });
});
