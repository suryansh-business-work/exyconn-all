import { Directory, File, Paths } from 'expo-file-system';
import type { OutboxImages, OutboxStorage } from '@exyconn/tracker-core';

/**
 * A file in the app's documents directory, read and written SYNCHRONOUSLY. The outbox depends
 * on that: an item is on disk before its upload is attempted, so a crash in between loses
 * nothing. The documents directory survives app updates and is only cleared by an uninstall.
 */
export function documentFile(name: string): OutboxStorage {
  const file = new File(Paths.document, name);
  return {
    read: () => (file.exists ? file.textSync() : null),
    write: (contents) => {
      if (!file.exists) {
        file.create();
      }
      file.write(contents);
    },
  };
}

/**
 * A folder in the documents directory holding one file per queued screenshot image (see
 * OutboxImages), so the queue file — and the JS heap reading it — stays small while offline.
 */
export function documentImages(folder: string): OutboxImages {
  const dir = new Directory(Paths.document, folder);
  const fileOf = (key: string): File => new File(dir, key);
  return {
    put: (key, image) => {
      dir.create({ intermediates: true, idempotent: true });
      const file = fileOf(key);
      if (!file.exists) {
        file.create();
      }
      file.write(image);
    },
    get: (key) => {
      const file = fileOf(key);
      return file.exists ? file.textSync() : null;
    },
    remove: (key) => {
      const file = fileOf(key);
      if (file.exists) {
        file.delete();
      }
    },
  };
}
