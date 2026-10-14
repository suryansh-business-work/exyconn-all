import type { DemoProfile } from '@exyconn/wa-flow';
import type { DemoRow } from '../../model/api';

/** A demo's profile as the form edits it — the stored `DemoProfile` shape. */
export type DemoProfileValues = DemoProfile;

export interface DemoProfileFormProps {
  /** The demo to edit, or null to create one. */
  demo: DemoRow | null;
  /** Called with the saved demo's id. */
  onSaved: (id: string) => void;
  onCancel: () => void;
}
