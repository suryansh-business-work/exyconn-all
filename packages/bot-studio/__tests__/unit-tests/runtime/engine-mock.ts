import { vi } from 'vitest';
import type { ChatState, EngineResult } from '@exyconn/wa-flow';
import type { ChatEvent, DemoBundle, EngineContext } from '@exyconn/wa-flow/engine';

/** Stand-ins for the conversation engine, so a test decides what each event produces. */
export const engineMock = {
  respond: vi.fn<(b: DemoBundle, s: ChatState, e: ChatEvent, c: EngineContext) => EngineResult>(),
  newChatState: vi.fn<(demoKey: string, seedText: string) => ChatState>(),
};
