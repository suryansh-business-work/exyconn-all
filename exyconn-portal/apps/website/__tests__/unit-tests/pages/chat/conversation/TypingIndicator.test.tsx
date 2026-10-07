import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { TypingIndicator } from '../../../../../src/pages/chat/conversation/TypingIndicator';
import { renderWithProviders } from '../../../test-utils';

describe('TypingIndicator', () => {
  it('announces who is typing, with the dots hidden from screen readers', () => {
    renderWithProviders(<TypingIndicator name="Asha" />);

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Asha is typing…');
    const dots = status.querySelector('[aria-hidden="true"]');
    expect(dots?.children).toHaveLength(3);
  });

  it('reads in the viewer’s language', () => {
    renderWithProviders(<TypingIndicator name="Asha" />, {
      locale: 'hi',
      messages: { '{name} is typing…': '{name} लिख रही हैं…' },
    });
    expect(screen.getByRole('status')).toHaveTextContent('Asha लिख रही हैं…');
  });
});
