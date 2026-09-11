import { File, Paths } from 'expo-file-system';
import type { OutboxStorage } from '@exyconn/tracker-core';

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
