import { app } from 'electron';
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import type { OutboxImages, OutboxStorage } from '@exyconn/tracker-core';

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

/** A folder under userData holding one file per queued screenshot image (see OutboxImages). */
export function userDataImages(folder: string): OutboxImages {
  const dir = join(app.getPath('userData'), folder);
  const path = (key: string): string => join(dir, key);
  return {
    put: (key, image) => {
      mkdirSync(dir, { recursive: true });
      writeFileSync(path(key), image, 'utf-8');
    },
    get: (key) => (existsSync(path(key)) ? readFileSync(path(key), 'utf-8') : null),
    remove: (key) => rmSync(path(key), { force: true }),
  };
}
