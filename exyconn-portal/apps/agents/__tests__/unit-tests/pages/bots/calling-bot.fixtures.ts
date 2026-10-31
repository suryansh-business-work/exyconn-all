import {
  CallingBotCallStatus,
  CallingBotChannel,
  CallingBotPhoneProvider,
  CallingBotTurnRole,
} from '@exyconn/shell/graphql/generated';
import type { CallRow } from '../../../../src/pages/bots/CallTranscriptDialog';
import type { CallFlowRow } from '../../../../src/pages/bots/call-flows/callFlow.model';
import type { CallingBotConfigRow } from '../../../../src/pages/bots/forms/calling-bot-config';
import type { CallingBotScenarioRow } from '../../../../src/pages/bots/forms/calling-bot-scenario';

/** A saved calling bot config as the settings list returns it. */
export function configRow(overrides: Partial<CallingBotConfigRow> = {}): CallingBotConfigRow {
  return {
    id: 'cfg-1',
    label: 'Clinic bot',
    hasSarvamApiKey: true,
    sarvamApiKeyHint: 'k9z1',
    hasOpenAiApiKey: true,
    openAiApiKeyHint: 'q2w3',
    openAiModel: 'gpt-4o-mini',
    systemPrompt: 'You book appointments for a dental clinic in Pune.',
    greeting: 'Namaste, Smile Dental here.',
    languageCode: 'hi-IN',
    ttsModel: 'bulbul:v2',
    ttsSpeaker: 'vidya',
    maxCallSeconds: 300,
    phoneProvider: CallingBotPhoneProvider.None,
    vobizAuthId: '',
    hasVobizAuthToken: false,
    vobizNumber: '',
    twilioAccountSid: '',
    hasTwilioAuthToken: false,
    twilioNumber: '',
    phoneEnabled: false,
    isActive: true,
    updatedAt: '2026-10-01T10:00:00.000Z',
    ...overrides,
  };
}

/** An example call as the Examples list returns it. */
export function scenarioRow(overrides: Partial<CallingBotScenarioRow> = {}): CallingBotScenarioRow {
  return {
    id: 'sc-1',
    title: 'Clinic booking',
    description: 'Book a dental check-up for next week.',
    systemPrompt: 'You are the front desk of a dental clinic and book check-ups.',
    greeting: 'Hello, Smile Dental.',
    languageCode: '',
    enabled: true,
    order: 10,
    updatedAt: '2026-10-01T10:00:00.000Z',
    ...overrides,
  };
}

/** An example with its call flow, as the Call flows tab reads it. */
export function flowRow(overrides: Partial<CallFlowRow> = {}): CallFlowRow {
  return {
    id: 'sc-1',
    title: 'Clinic booking',
    description: 'Book a dental check-up for next week.',
    greeting: 'Hello, Smile Dental.',
    enabled: true,
    flow: null,
    callScript: 'Say hello. Offer a slot.',
    updatedAt: '2026-10-01T10:00:00.000Z',
    ...overrides,
  };
}

/** One recent call, answered at 10:00:00 and ended 2:05 later. */
export function callRow(overrides: Partial<CallRow> = {}): CallRow {
  return {
    id: 'call-1',
    callerName: 'Asha Rao',
    callerEmail: 'asha@example.com',
    channel: CallingBotChannel.Browser,
    status: CallingBotCallStatus.Ended,
    phone: '',
    languageCode: 'hi-IN',
    answeredAt: '2026-10-01T10:00:00.000Z',
    endedAt: '2026-10-01T10:02:05.000Z',
    endReason: '',
    scenarioTitle: 'Clinic booking',
    createdAt: '2026-10-01T09:59:50.000Z',
    transcript: [
      {
        role: CallingBotTurnRole.Bot,
        text: 'Hello, Smile Dental.',
        at: '2026-10-01T10:00:01.000Z',
      },
      {
        role: CallingBotTurnRole.Caller,
        text: 'I need a check-up.',
        at: '2026-10-01T10:00:05.000Z',
      },
    ],
    ...overrides,
  };
}
