import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { ChatConsoleStatus } from '../../../../../src/pages/chat/alerts/ChatConsoleStatus';
import type { ChatConnection } from '../../../../../src/pages/chat/socket/chatSocket.types';
import { fakeConsole, renderWithConsole } from '../chat-console';

const CASES: ReadonlyArray<[ChatConnection, string, string]> = [
  ['ready', 'Live', 'MuiChip-colorSuccess'],
  ['connecting', 'Connecting…', 'MuiChip-colorDefault'],
  ['offline', 'Offline — reconnecting', 'MuiChip-colorWarning'],
];

describe('ChatConsoleStatus', () => {
  it.each(CASES)('reads %s as "%s"', (connection, label, colour) => {
    renderWithConsole(<ChatConsoleStatus />, () => fakeConsole({ connection }));

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent(label);
    expect(status).toHaveClass(colour);
  });

  it('sits next to the notification settings', () => {
    renderWithConsole(<ChatConsoleStatus />, () => fakeConsole());
    expect(screen.getByRole('button', { name: 'Notification settings' })).toBeInTheDocument();
  });
});
