import type { ReactElement } from 'react';
import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import type { Illustration, RenderedOption, RenderedProduct } from '@exyconn/wa-flow';
import {
  ChatActionsProvider,
  type ChatActions,
} from '../../../../../src/components/wa/ChatActions';
import type { Frame } from '../../../../../src/components/wa/messages/types';
import { renderWithProviders, type ProviderOptions } from '../../../test-utils';

/** The first message of a run, sent at half past ten. */
export const frame: Frame = { tail: true, time: '10:30 AM' };

export function makeActions() {
  return {
    choose: vi.fn(),
    openDocument: vi.fn(),
    openTicket: vi.fn(),
    explainExternal: vi.fn(),
  } satisfies ChatActions;
}

/** Renders a message inside the chat's actions, as the chat pane does. */
export function renderMessage(ui: ReactElement, options: Readonly<ProviderOptions> = {}) {
  const actions = makeActions();
  const view = renderWithProviders(
    <ChatActionsProvider value={actions}>{ui}</ChatActionsProvider>,
    options,
  );
  return { ...view, actions, user: userEvent.setup() };
}

export function option(id: string, title = id, description?: string): RenderedOption {
  return { id, title, description, ref: { workflow: 'booking', node: 'pick', handle: id } };
}

export const picture: Illustration = {
  icon: 'calendar',
  accent: 'teal',
  title: 'Your visit',
  subtitle: 'Tomorrow, 10 AM',
};

export function product(overrides: Partial<RenderedProduct> = {}): RenderedProduct {
  return {
    id: 'p-1',
    title: 'Hydra facial',
    price: 800,
    image: { icon: 'gift', accent: 'pink' },
    ...overrides,
  };
}
