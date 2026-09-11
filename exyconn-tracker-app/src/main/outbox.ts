import { app } from 'electron';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { Outbox as CoreOutbox, type OutboxStorage } from '@exyconn/tracker-core';

export type { FailureKind, FlushResult, OutboxItem } from '@exyconn/tracker-core';

/** The queue file under userData, so it survives restarts and app updates alike. */
function fileStorage(): OutboxStorage {
  const dir = app.getPath('userData');
  const file = join(dir, 'tracker-outbox.json');
  return {
    read: () => (existsSync(file) ? readFileSync(file, 'utf-8') : null),
    write: (contents) => {
      mkdirSync(dir, { recursive: true });
      writeFileSync(file, contents, 'utf-8');
    },
  };
}

/**
 * The durable retry queue (`@exyconn/tracker-core`), kept on this computer's disk. The queueing,
 * ordering and poison-item rules are shared with the mobile app; only where it lives is ours.
 */
export class Outbox extends CoreOutbox {
  constructor() {
    super(fileStorage());
  }
}
