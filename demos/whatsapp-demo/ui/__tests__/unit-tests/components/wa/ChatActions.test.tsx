import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import {
  ChatActionsProvider,
  useChatActions,
  type ChatActions,
} from '../../../../src/components/wa/ChatActions';

describe('useChatActions', () => {
  it('hands a message the actions of the chat it is in', () => {
    const actions: ChatActions = {
      choose: vi.fn(),
      openDocument: vi.fn(),
      openTicket: vi.fn(),
      explainExternal: vi.fn(),
    };
    const wrapper = ({ children }: Readonly<{ children: ReactNode }>) => (
      <ChatActionsProvider value={actions}>{children}</ChatActionsProvider>
    );
    const { result } = renderHook(() => useChatActions(), { wrapper });
    expect(result.current).toBe(actions);
  });

  it('refuses to run outside a chat', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => renderHook(() => useChatActions())).toThrow(
      'useChatActions must be used inside a ChatActionsProvider',
    );
    consoleError.mockRestore();
  });
});
