import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { UserMessage } from '../../../../../src/components/wa/messages/UserMessage';
import { renderWithProviders } from '../../../test-utils';
import { frame } from './messages.fixtures';

describe('UserMessage', () => {
  it('shows a tapped option quoting the message it answered, with its ticks', () => {
    const { container } = renderWithProviders(
      <UserMessage
        content={{ type: 'reply', text: 'Book a visit', quoted: 'What would you like to do?' }}
        status="delivered"
        frame={frame}
      />,
    );
    expect(container).toHaveTextContent('What would you like to do?Book a visit');
    expect(screen.getByTitle('Delivered')).toBeInTheDocument();
    expect(screen.getByText('10:30 AM')).toBeInTheDocument();
  });

  it('shows typed text on its own', () => {
    renderWithProviders(
      <UserMessage
        content={{ type: 'text', text: 'Hi *there*' }}
        status={undefined}
        frame={frame}
      />,
    );
    expect(screen.getByText('there')).toBeInTheDocument();
    expect(screen.queryByTitle('Sent')).not.toBeInTheDocument();
  });
});
