import { describe, expect, it } from 'vitest';
import { syncMessage } from '../../src/sync-text';
import { t } from './translator';

describe('syncMessage', () => {
  it('says nothing before any sync has run', () => {
    expect(syncMessage(t, null)).toBeNull();
  });

  it('confirms a clean upload, singular and plural', () => {
    expect(syncMessage(t, { kind: 'uploaded', count: 1, discarded: 0 })).toEqual({
      severity: 'success',
      text: 'Uploaded 1 item.',
    });
    expect(syncMessage(t, { kind: 'uploaded', count: 4, discarded: 0 })).toEqual({
      severity: 'success',
      text: 'Uploaded 4 items.',
    });
  });

  it('warns out loud when an item was skipped', () => {
    expect(syncMessage(t, { kind: 'uploaded', count: 3, discarded: 1 })).toEqual({
      severity: 'warning',
      text: 'Uploaded 3 items. 1 item could not be uploaded and was skipped.',
    });
  });

  it('counts several skipped items in the plural', () => {
    expect(syncMessage(t, { kind: 'uploaded', count: 0, discarded: 2 })?.text).toBe(
      'Uploaded 0 items. 2 items could not be uploaded and were skipped.',
    );
  });

  it('explains that there was nothing queued', () => {
    expect(syncMessage(t, { kind: 'nothing' })).toEqual({
      severity: 'info',
      text: 'Nothing to upload — everything recorded so far is already on the portal.',
    });
  });

  it('passes an unavailable reason through the translator as information', () => {
    expect(syncMessage(t, { kind: 'unavailable', reason: 'You are offline.' })).toEqual({
      severity: 'info',
      text: 'You are offline.',
    });
  });

  it('reports a failure as a warning with its reason', () => {
    expect(syncMessage(t, { kind: 'failed', reason: 'The portal refused it.' })).toEqual({
      severity: 'warning',
      text: 'The portal refused it.',
    });
  });
});
