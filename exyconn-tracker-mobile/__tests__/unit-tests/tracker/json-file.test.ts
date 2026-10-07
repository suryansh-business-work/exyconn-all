import { describe, expect, it } from 'vitest';
import { documentFile, documentImages } from '../../../src/tracker/json-file';
import { fileSystemTest } from '../mocks/expo-file-system';

const QUEUE_URI = 'file:///document/queue.json';
const IMAGES_DIR = 'file:///document/images';

describe('documentFile', () => {
  it('reads nothing before the file has ever been written', () => {
    expect(documentFile('queue.json').read()).toBeNull();
  });

  it('creates the file on the first write and reads it back synchronously', () => {
    const file = documentFile('queue.json');
    file.write('[1]');
    expect(fileSystemTest.files.get(QUEUE_URI)).toBe('[1]');
    expect(file.read()).toBe('[1]');
  });

  it('overwrites an existing file instead of failing to create it again', () => {
    const file = documentFile('queue.json');
    file.write('[1]');
    file.write('[1,2]');
    expect(documentFile('queue.json').read()).toBe('[1,2]');
  });
});

describe('documentImages', () => {
  it('stores one file per key inside its folder', () => {
    const images = documentImages('images');
    images.put('shot-1', 'base64-a');
    expect(fileSystemTest.directories.has(IMAGES_DIR)).toBe(true);
    expect(fileSystemTest.files.get(`${IMAGES_DIR}/shot-1`)).toBe('base64-a');
    expect(images.get('shot-1')).toBe('base64-a');
  });

  it('replaces an image already stored under the same key', () => {
    const images = documentImages('images');
    images.put('shot-1', 'base64-a');
    images.put('shot-1', 'base64-b');
    expect(images.get('shot-1')).toBe('base64-b');
  });

  it('reads null for a key that was never stored', () => {
    expect(documentImages('images').get('missing')).toBeNull();
  });

  it('removes an image, and removing one that is gone is harmless', () => {
    const images = documentImages('images');
    images.put('shot-1', 'base64-a');
    images.remove('shot-1');
    expect(images.get('shot-1')).toBeNull();
    expect(() => images.remove('shot-1')).not.toThrow();
  });
});
