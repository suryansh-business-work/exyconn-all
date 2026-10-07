import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { MessageText } from '../../../../../src/components/wa/messages/MessageText';
import { renderWithProviders } from '../../../test-utils';

describe('MessageText', () => {
  it('stacks the agent, header, body and footer', () => {
    const { container } = renderWithProviders(
      <MessageText
        sender="Priya (front desk)"
        header="*Your booking*"
        text="See you at 10"
        footer="Reply STOP to opt out"
      />,
    );
    expect(container).toHaveTextContent(
      'Priya (front desk)Your bookingSee you at 10Reply STOP to opt out',
    );
    expect(screen.queryByText('*Your booking*')).not.toBeInTheDocument();
  });

  it('shows only the body when that is all there is', () => {
    const { container } = renderWithProviders(<MessageText text="Just the text" />);
    expect(container.textContent).toBe('Just the text');
  });

  it('renders nothing with nothing to say', () => {
    const { container } = renderWithProviders(<MessageText />);
    expect(container.textContent).toBe('');
  });
});
