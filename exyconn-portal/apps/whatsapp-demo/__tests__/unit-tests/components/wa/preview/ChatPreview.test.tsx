import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import type { DemoBundle } from '@exyconn/wa-flow/engine';
import { ChatPreview } from '../../../../../src/components/wa/preview';
import { renderWithProviders } from '../../../test-utils';

interface PaneProps {
  bundle: { revision: string; demo: { key: string } };
  messages: readonly unknown[];
  typing: boolean;
  onSend: (text: string) => void;
  onChoose: (option: unknown, quoted: string) => void;
  onClear: () => void;
  onBack: () => unknown;
}

const deps = vi.hoisted(() => ({
  aiSession: '',
  read: vi.fn(),
  context: vi.fn(),
  options: undefined as
    undefined | ({ bundles: ReadonlyMap<string, unknown> } & Record<string, unknown>),
  pane: undefined as unknown,
  runtime: {
    store: {
      chats: {} as Record<string, unknown>,
      pending: [],
      typing: {} as Record<string, boolean>,
    },
    open: vi.fn(),
    send: vi.fn(),
    choose: vi.fn(),
    clear: vi.fn(),
  },
}));

vi.mock('../../../../../src/hooks/useDemoUser', () => ({
  useDemoUser: () => ({
    id: 'u-1',
    fullName: 'Asha Nair',
    firstName: 'Asha',
    email: '',
    phone: '',
  }),
}));
vi.mock('../../../../../src/hooks/useAiParse', () => ({
  useAiParse: (session: string) => {
    deps.aiSession = session;
    return { configured: false, read: deps.read };
  },
}));
vi.mock('../../../../../src/hooks/useEngineContext', () => ({
  useEngineContext: () => deps.context,
}));
vi.mock('../../../../../src/runtime/useChatRuntime', () => ({
  useChatRuntime: (options: typeof deps.options) => {
    deps.options = options;
    return deps.runtime;
  },
}));
vi.mock('../../../../../src/components/wa/chat/ChatPane', () => ({
  ChatPane: (props: unknown) => {
    deps.pane = props;
    return <p>Chat pane</p>;
  },
}));

const bundle = {
  demo: { key: 'clinic', menuText: 'How can we help?' },
  workflows: [{ key: 'booking', name: 'Book a visit' }],
} as unknown as DemoBundle;

const pane = () => deps.pane as PaneProps;

beforeEach(() => {
  deps.runtime.store = { chats: {}, pending: [], typing: {} };
  for (const fn of [
    deps.runtime.open,
    deps.runtime.send,
    deps.runtime.choose,
    deps.runtime.clear,
  ]) {
    fn.mockReset();
  }
});

describe('ChatPreview', () => {
  it('runs the draft in memory only, as the open chat, without analytics', () => {
    renderWithProviders(<ChatPreview bundle={bundle} />);
    expect(deps.aiSession).toBe('editor-preview');
    expect(deps.options).toMatchObject({
      context: deps.context,
      storageUserId: null,
      seedText: 'u-1',
      activeKey: 'clinic',
      parse: deps.read,
    });
    expect(deps.options?.track).toBeUndefined();
    expect(deps.options?.bundles.get('clinic')).toEqual({ ...bundle, revision: 'preview' });
    expect(screen.getByRole('region', { name: 'WhatsApp preview' })).toBeInTheDocument();
  });

  it('opens the chat once per mount', () => {
    const { rerender } = renderWithProviders(<ChatPreview bundle={bundle} />);
    rerender(<ChatPreview bundle={bundle} />);
    expect(deps.runtime.open).toHaveBeenCalledTimes(1);
    expect(deps.runtime.open).toHaveBeenCalledWith('clinic');
    expect(deps.runtime.choose).not.toHaveBeenCalled();
  });

  it('jumps straight into the workflow being edited, as if picked from the menu', () => {
    renderWithProviders(<ChatPreview bundle={bundle} startWorkflow="booking" />);
    expect(deps.runtime.choose).toHaveBeenCalledWith(
      'clinic',
      {
        id: 'booking',
        title: 'Book a visit',
        ref: { workflow: '$menu', node: '$menu', handle: 'booking' },
      },
      'How can we help?',
    );
  });

  it('just opens the chat when the workflow is not in the bundle', () => {
    renderWithProviders(<ChatPreview bundle={bundle} startWorkflow="missing" />);
    expect(deps.runtime.open).toHaveBeenCalledTimes(1);
    expect(deps.runtime.choose).not.toHaveBeenCalled();
  });

  it('shows an empty, idle chat before anything arrives', () => {
    renderWithProviders(<ChatPreview bundle={bundle} />);
    expect(pane()).toMatchObject({ messages: [], typing: false });
    expect(pane().bundle.revision).toBe('preview');
  });

  it('shows the transcript and typing state, and routes what the viewer does to this chat', () => {
    const messages = [{ id: 'm1' }];
    deps.runtime.store = { chats: { clinic: { messages } }, pending: [], typing: { clinic: true } };
    renderWithProviders(<ChatPreview bundle={bundle} />);
    expect(pane()).toMatchObject({ messages, typing: true });
    pane().onSend('hi');
    pane().onChoose({ id: 'x' }, 'quoted');
    pane().onClear();
    expect(deps.runtime.send).toHaveBeenCalledWith('clinic', 'hi');
    expect(deps.runtime.choose).toHaveBeenCalledWith('clinic', { id: 'x' }, 'quoted');
    expect(deps.runtime.clear).toHaveBeenCalledWith('clinic');
    expect(pane().onBack()).toBeUndefined();
  });
});
