import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { DateChip } from '../../../../../src/components/wa/chat/DateChip';
import { EmptyPane } from '../../../../../src/components/wa/chat/EmptyPane';
import { TypingBubble } from '../../../../../src/components/wa/chat/TypingBubble';
import { renderWithProviders } from '../../../test-utils';

describe('DateChip', () => {
  it('separates days with a labelled chip', () => {
    renderWithProviders(<DateChip label="Yesterday" />);
    const chip = screen.getByRole('separator', { name: 'Yesterday' });
    expect(chip).toHaveTextContent('Yesterday');
  });
});

describe('TypingBubble', () => {
  it('announces typing… with three dots', () => {
    renderWithProviders(<TypingBubble />);
    const status = screen.getByRole('status', { name: 'typing…' });
    expect(status.firstElementChild?.children).toHaveLength(3);
  });

  it('translates its label', () => {
    renderWithProviders(<TypingBubble />, { messages: { 'typing…': 'écrit…' } });
    expect(screen.getByRole('status', { name: 'écrit…' })).toBeInTheDocument();
  });
});

describe('EmptyPane', () => {
  it('invites the viewer to pick a business and says nothing leaves the page', () => {
    renderWithProviders(<EmptyPane />);
    expect(screen.getByRole('heading', { level: 2, name: 'Business chats' })).toBeInTheDocument();
    expect(screen.getByText(/Pick a business on the left/)).toBeInTheDocument();
    expect(
      screen.getByText('Simulated conversations — nothing leaves this page'),
    ).toBeInTheDocument();
  });
});
