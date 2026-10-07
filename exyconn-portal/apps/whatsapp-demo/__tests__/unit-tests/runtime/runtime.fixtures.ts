import { vi } from 'vitest';
import type {
  ChatMessage,
  ChatState,
  DemoProfile,
  EngineResult,
  MessageStatus,
  OutgoingMessage,
  PendingPush,
} from '@exyconn/wa-flow';
import type { EngineContext } from '@exyconn/wa-flow/engine';
import type { CatalogBundle, RuntimeOptions } from '../../../src/runtime/types';

/** A published demo; the runtime only reads its key and revision. */
export function bundle(key = 'clinic', revision = 'r1'): CatalogBundle {
  return { demo: { key } as DemoProfile, workflows: [], revision };
}

export function chatState(demoKey = 'clinic', seq = 0): ChatState {
  return { demoKey, vars: {}, seq, seed: 7 };
}

export function botMessage(id: string, text = id): ChatMessage {
  return { id, from: 'bot', at: 0, content: { type: 'text', text } };
}

export function userMessage(id: string, status?: MessageStatus): ChatMessage {
  return { id, from: 'user', at: 0, content: { type: 'text', text: id }, status };
}

export function reply(id: string, typingMs: number): OutgoingMessage {
  return { message: botMessage(id), typingMs };
}

export function push(id: string, at: number, demoKey = 'clinic'): PendingPush {
  return { id, demoKey, workflow: 'booking', node: 'reminder', at };
}

/** An engine result with nothing in it but the new state. */
export function result(partial: Partial<EngineResult> = {}): EngineResult {
  return { state: chatState(), replies: [], scheduled: [], signals: [], ...partial };
}

export function engineContext(): EngineContext {
  return {
    now: Date.now(),
    user: { firstName: 'Asha', fullName: 'Asha Nair', email: 'asha@example.com', phone: '' },
    t: (source) => `T:${source}`,
    format: {
      date: String,
      time: String,
      day: String,
      money: String,
    },
    ai: false,
  };
}

export function runtimeOptions(overrides: Partial<RuntimeOptions> = {}): RuntimeOptions {
  return {
    bundles: new Map([['clinic', bundle()]]),
    context: engineContext,
    storageUserId: null,
    seedText: 'u-1',
    activeKey: 'clinic',
    track: vi.fn(),
    ...overrides,
  };
}
