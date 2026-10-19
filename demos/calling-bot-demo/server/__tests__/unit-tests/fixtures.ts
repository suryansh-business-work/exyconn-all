import { EventEmitter } from 'node:events';
import { vi } from 'vitest';
import type { CallingBotCallRecord, CallingBotConfigRecord } from '../../src/index';
import type { TicketedCall } from '../../src/runtime/store';

/** A stored call, as the store reads it. */
export function makeCall(overrides: Partial<CallingBotCallRecord> = {}): CallingBotCallRecord {
  return {
    _id: '64b000000000000000000001',
    channel: 'BROWSER',
    status: 'STARTING',
    callerId: 'visitor:1',
    callerName: 'Asha',
    callerEmail: 'asha@example.com',
    phone: '',
    languageCode: 'en-IN',
    providerCallId: '',
    answeredAt: null,
    endedAt: null,
    endReason: '',
    transcript: [],
    createdAt: new Date('2026-10-01T00:00:00Z'),
    updatedAt: new Date('2026-10-01T00:00:00Z'),
    ...overrides,
  };
}

/** The active config, with stand-in keys (never real ones). */
export function makeConfig(overrides: Partial<CallingBotConfigRecord> = {}): CallingBotConfigRecord {
  return {
    _id: '64b0000000000000000000c1',
    label: 'Demo',
    sarvamApiKey: 'sarvam-test-key',
    openAiApiKey: 'openai-test-key',
    openAiModel: 'gpt-test',
    systemPrompt: 'You book clinic visits.',
    greeting: 'Hello, how can I help?',
    languageCode: 'en-IN',
    ttsModel: 'bulbul:v2',
    ttsSpeaker: 'anushka',
    maxCallSeconds: 60,
    phoneProvider: 'NONE',
    vobizAuthId: '',
    vobizAuthToken: '',
    vobizNumber: '',
    twilioAccountSid: '',
    twilioAuthToken: '',
    twilioNumber: '',
    ticketSecret: 'ticket-test-secret',
    isActive: true,
    ...overrides,
  };
}

export const makeTicketed = (): TicketedCall => ({ call: makeCall(), config: makeConfig() });

/** The side of a `ws` socket the transports use: events in, send/close out. */
export class FakeSocket extends EventEmitter {
  readonly send = vi.fn();
  readonly close = vi.fn();

  /** Delivers a JSON text frame, as `ws` hands one over (a Buffer, not binary). */
  receive(message: object): void {
    this.emit('message', Buffer.from(JSON.stringify(message)), false);
  }

  /** The JSON messages sent so far. */
  sentJson(): unknown[] {
    return this.send.mock.calls.map(([text]) => JSON.parse(String(text)) as unknown);
  }
}
