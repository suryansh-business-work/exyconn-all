import { Outbox as CoreOutbox } from '@exyconn/tracker-core';
import { userDataFile, userDataImages } from './file-storage';

export type { FailureKind, FlushResult, OutboxItem } from '@exyconn/tracker-core';

/**
 * The durable retry queue (`@exyconn/tracker-core`), kept on this computer's disk. The queueing,
 * ordering and poison-item rules are shared with the mobile app; only where it lives is ours.
 */
export class Outbox extends CoreOutbox {
  constructor() {
    super(userDataFile('tracker-outbox.json'), userDataImages('tracker-outbox-images'));
  }
}
