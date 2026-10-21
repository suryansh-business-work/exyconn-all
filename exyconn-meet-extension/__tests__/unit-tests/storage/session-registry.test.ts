import { describe, expect, it } from 'vitest';
import {
  createSessionRegistry,
  isCapturing,
  newTabSession,
} from '../../../src/storage/session-registry';
import { MemoryArea } from '../chrome-mock';

const page = (code: string) => ({
  meetingCode: code,
  url: `https://meet.google.com/${code}`,
  title: code,
});

describe('session registry', () => {
  it('keeps different Meet tabs fully separate', async () => {
    const registry = createSessionRegistry(new MemoryArea());
    await registry.put(newTabSession(1, 'k1', page('aaa-bbbb-ccc')));
    await registry.put(newTabSession(2, 'k2', page('ddd-eeee-fff')));
    await registry.update(1, (s) => ({ ...s, meetingId: 'm1', captureState: 'RECORDING' }));
    expect((await registry.get(2))?.meetingId).toBeNull();
    expect((await registry.get(2))?.captureState).toBe('IDLE');
    expect((await registry.all()).map((s) => s.tabId)).toEqual([1, 2]);
  });

  it('finds another tab already capturing the same call, never the asking tab', async () => {
    const registry = createSessionRegistry(new MemoryArea());
    await registry.put({
      ...newTabSession(1, 'k1', page('aaa-bbbb-ccc')),
      meetingId: 'm1',
      captureState: 'PAUSED',
    });
    await registry.put({ ...newTabSession(2, 'k2', page('aaa-bbbb-ccc')), meetingId: 'm1' });
    expect((await registry.captureOwner('m1', 2))?.tabId).toBe(1);
    expect(await registry.captureOwner('m1', 1)).toBeNull();
    expect(await registry.captureOwner('other', 2)).toBeNull();
  });

  it('survives a worker restart because it lives in storage', async () => {
    const area = new MemoryArea();
    await createSessionRegistry(area).put(newTabSession(7, 'k', page('aaa-bbbb-ccc')));
    expect((await createSessionRegistry(area).get(7))?.sessionKey).toBe('k');
  });

  it('serialises concurrent updates so none is lost', async () => {
    const registry = createSessionRegistry(new MemoryArea());
    await registry.put(newTabSession(1, 'k', page('aaa-bbbb-ccc')));
    await Promise.all(
      Array.from({ length: 20 }, () =>
        registry.update(1, (s) => ({ ...s, pendingUploads: s.pendingUploads + 1 })),
      ),
    );
    expect((await registry.get(1))?.pendingUploads).toBe(20);
  });

  it('keeps working after a failed update', async () => {
    const registry = createSessionRegistry(new MemoryArea());
    await registry.put(newTabSession(1, 'k', page('aaa-bbbb-ccc')));
    await expect(
      registry.update(1, () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
    expect((await registry.get(1))?.tabId).toBe(1);
  });

  it('returns null for unknown tabs and removes sessions', async () => {
    const registry = createSessionRegistry(new MemoryArea());
    expect(await registry.update(9, (s) => s)).toBeNull();
    expect(await registry.remove(9)).toBeNull();
    await registry.put(newTabSession(3, 'k', page('aaa-bbbb-ccc')));
    expect((await registry.remove(3))?.tabId).toBe(3);
    expect(await registry.get(3)).toBeNull();
  });

  it('reads a corrupt store as empty', async () => {
    const area = new MemoryArea();
    await area.set({ sessions: 'corrupt', chunkSeqs: 7 });
    const registry = createSessionRegistry(area);
    expect(await registry.all()).toEqual([]);
    expect(await registry.takeSeq('m1', 'TAB')).toBe(0);
  });

  it('numbers chunks per meeting and stream, across tabs and restarts', async () => {
    const area = new MemoryArea();
    const registry = createSessionRegistry(area);
    expect(await registry.takeSeq('m1', 'TAB')).toBe(0);
    expect(await registry.takeSeq('m1', 'TAB')).toBe(1);
    expect(await registry.takeSeq('m1', 'MIC')).toBe(0);
    expect(await registry.takeSeq('m2', 'TAB')).toBe(0);
    expect(await createSessionRegistry(area).takeSeq('m1', 'TAB')).toBe(2);
  });

  it('counts recording and paused as capturing', () => {
    const session = newTabSession(1, 'k', page('aaa-bbbb-ccc'));
    expect(isCapturing({ ...session, captureState: 'RECORDING' })).toBe(true);
    expect(isCapturing({ ...session, captureState: 'PAUSED' })).toBe(true);
    expect(isCapturing({ ...session, captureState: 'STOPPED' })).toBe(false);
  });
});
