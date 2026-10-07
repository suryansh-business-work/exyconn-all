import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ConversationActions,
  type ConversationActionsProps,
} from '../../../../../src/pages/chat/conversation/ConversationActions';
import { renderWithProviders } from '../../../test-utils';

function renderActions(overrides: Partial<ConversationActionsProps> = {}) {
  const props: ConversationActionsProps = {
    isMine: false,
    isClosed: false,
    claiming: false,
    onClaim: vi.fn(),
    onClose: vi.fn(),
    onDownload: vi.fn(),
    onDelete: vi.fn(),
    ...overrides,
  };
  renderWithProviders(<ConversationActions {...props} />);
  return props;
}

const button = (name: string) => screen.getByRole('button', { name });
const buttonNames = () => screen.getAllByRole('button').map((element) => element.textContent);

describe('ConversationActions', () => {
  it('offers claim, close, download and delete on an open chat nobody has claimed', async () => {
    const props = renderActions();
    expect(buttonNames()).toEqual(['Claim', 'Close chat', 'Download conversation', 'Delete']);

    await userEvent.click(button('Claim'));
    await userEvent.click(button('Close chat'));
    await userEvent.click(button('Download conversation'));
    await userEvent.click(button('Delete'));

    expect(props.onClaim).toHaveBeenCalledTimes(1);
    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onDownload).toHaveBeenCalledTimes(1);
    expect(props.onDelete).toHaveBeenCalledTimes(1);
  });

  it('holds the claim button while a claim is under way', () => {
    renderActions({ claiming: true });
    expect(button('Claim')).toBeDisabled();
  });

  it('does not offer to claim a chat that is already the agent’s', () => {
    renderActions({ isMine: true });
    expect(buttonNames()).toEqual(['Close chat', 'Download conversation', 'Delete']);
  });

  it('keeps only download and delete once the chat has ended', () => {
    renderActions({ isClosed: true });
    expect(buttonNames()).toEqual(['Download conversation', 'Delete']);
  });
});
