import { describe, expect, it, vi } from 'vitest';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** userData points at a folder that does not exist yet, so the writers have to create it. */
const userData = join(mkdtempSync(join(tmpdir(), 'file-storage-')), 'userData');

vi.mock('electron', () => ({ app: { getPath: () => userData } }));

import { userDataFile, userDataImages } from '../../../src/main/file-storage';

describe('userDataFile', () => {
  it('reads nothing before the first write', () => {
    expect(userDataFile('never-written.json').read()).toBeNull();
  });

  it('creates userData on first write and reads back what it wrote', () => {
    const storage = userDataFile('queue.json');

    storage.write('[1,2,3]');

    expect(readFileSync(join(userData, 'queue.json'), 'utf-8')).toBe('[1,2,3]');
    expect(storage.read()).toBe('[1,2,3]');
  });

  it('replaces the whole file on the next write', () => {
    const storage = userDataFile('replace.json');
    storage.write('first');
    storage.write('second');

    expect(storage.read()).toBe('second');
  });
});

describe('userDataImages', () => {
  it('keeps one file per key in its own folder, and forgets it on remove', () => {
    const images = userDataImages('images');

    expect(images.get('shot-1')).toBeNull();

    images.put('shot-1', 'base64-data');
    expect(existsSync(join(userData, 'images', 'shot-1'))).toBe(true);
    expect(images.get('shot-1')).toBe('base64-data');

    images.remove('shot-1');
    expect(images.get('shot-1')).toBeNull();
  });

  it('removing a key that was never stored is not an error', () => {
    expect(() => userDataImages('images').remove('missing')).not.toThrow();
  });
});
