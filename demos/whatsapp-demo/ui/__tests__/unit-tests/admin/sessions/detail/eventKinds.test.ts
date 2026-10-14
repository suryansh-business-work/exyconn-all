import { describe, expect, it } from 'vitest';
import { WhatsappDemoEventType } from '@exyconn/shell/graphql/generated';
import { EVENT_KINDS, readAiMeta } from '../../../../../src/admin/sessions/detail/eventKinds';

describe('EVENT_KINDS', () => {
  it('gives every recorded event type an icon and a distinct label', () => {
    const types = Object.values(WhatsappDemoEventType);
    for (const type of types) {
      expect(EVENT_KINDS[type].icon).toBeTruthy();
      expect(EVENT_KINDS[type].label).not.toBe('');
    }
    const labels = new Set(types.map((type) => EVENT_KINDS[type].label));
    expect(labels.size).toBe(types.length);
    expect(EVENT_KINDS[WhatsappDemoEventType.AiCall].label).toBe('AI call');
  });
});

describe('readAiMeta', () => {
  it('reads a successful call', () => {
    expect(readAiMeta({ ok: true, latencyMs: 840, error: null })).toEqual({
      ok: true,
      latencyMs: 840,
      error: null,
    });
  });

  it('reads a failed call with its reason', () => {
    expect(readAiMeta({ ok: false, latencyMs: 12, error: 'timeout' })).toEqual({
      ok: false,
      latencyMs: 12,
      error: 'timeout',
    });
  });

  it('treats anything but the right types as unknown', () => {
    expect(readAiMeta({ ok: 'yes', latencyMs: '840', error: 42 })).toEqual({
      ok: false,
      latencyMs: null,
      error: null,
    });
    expect(readAiMeta({})).toEqual({ ok: false, latencyMs: null, error: null });
  });

  it('has nothing to read without an object', () => {
    expect(readAiMeta(null)).toBeNull();
    expect(readAiMeta(undefined)).toBeNull();
    expect(readAiMeta('ok')).toBeNull();
    expect(readAiMeta(5)).toBeNull();
  });
});
