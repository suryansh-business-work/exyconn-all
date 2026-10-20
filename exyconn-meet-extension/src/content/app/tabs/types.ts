import type { Logger } from '@exyconn/logger';
import type { ExtensionPrefs } from '../../../storage/prefs';
import type { WorkerState, TabSnapshot } from '../../../types/messages';

/** What every panel tab receives. */
export interface TabProps {
  state: WorkerState;
  tab: TabSnapshot;
  prefs: ExtensionPrefs;
  logger: Logger;
}
