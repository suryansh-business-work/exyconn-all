import { app } from 'electron';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { OutboxStorage } from '@exyconn/tracker-core';

/**
 * A file under userData, read and written synchronously, so it survives restarts and app
 * updates alike and is on disk before anything that could crash runs.
 */
export function userDataFile(name: string): OutboxStorage {
  const dir = app.getPath('userData');
  const file = join(dir, name);
  return {
    read: () => (existsSync(file) ? readFileSync(file, 'utf-8') : null),
    write: (contents) => {
      mkdirSync(dir, { recursive: true });
      writeFileSync(file, contents, 'utf-8');
    },
  };
}
