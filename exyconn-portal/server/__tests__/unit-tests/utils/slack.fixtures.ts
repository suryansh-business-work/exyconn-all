import { logger } from '../../../src/utils/logger';
import {
  SlackConfigModel,
  type SlackConfigDocument,
} from '../../../src/modules/tech/slack-config.model';
import { asArg } from '../../mockAs';

/** Shared doubles for the Slack notifier suites. */
export const config = {
  label: 'Workspace bot',
  botToken: `xoxb-${Date.now()}`,
  defaultChannel: '#general',
  signingSecret: `signing-${Date.now()}`,
  isActive: true,
} as SlackConfigDocument;

export const ok = (body: Record<string, unknown> = {}) =>
  new Response(JSON.stringify({ ok: true, ...body }));
export const failed = (error?: string) => new Response(JSON.stringify({ ok: false, error }));

/** Makes `value` the active Slack configuration, for both lookups the notifier makes. */
export function active(value: SlackConfigDocument | null) {
  const lean = jest.fn().mockResolvedValue(value);
  return jest
    .spyOn(SlackConfigModel, 'findOne')
    .mockReturnValue(asArg({ lean, select: () => ({ lean }) }));
}

/** Spies on fetch and quiets the info log; returns the fetch spy. */
export function stubSlack(): jest.SpyInstance {
  jest.spyOn(logger, 'info').mockImplementation(() => undefined);
  return jest.spyOn(globalThis, 'fetch');
}

/** The Slack method and JSON body of the nth request. */
export function sentCall(
  fetchMock: jest.SpyInstance,
  index = 0,
): { method: string; body: Record<string, unknown> } {
  const [url, init] = fetchMock.mock.calls[index] as [string, RequestInit];
  return { method: url.replace('https://slack.com/api/', ''), body: JSON.parse(String(init.body)) };
}
