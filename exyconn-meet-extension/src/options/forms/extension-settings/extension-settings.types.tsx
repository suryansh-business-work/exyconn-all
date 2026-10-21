import type { MaExtensionContextQuery } from '../../../graphql/generated';
import type { ExtensionPrefs } from '../../../storage/prefs';

/** The form's values are exactly the stored preferences (validated by `prefsSchema`). */
export type ExtensionSettingsValues = ExtensionPrefs;

/** The company switches that limit what the user may turn on (codegen-typed). */
export type ExtensionOrgSwitches = Pick<
  MaExtensionContextQuery['maExtensionContext'],
  'participantTracking' | 'liveTranscript' | 'remindersEnabled' | 'reminderIntervalMinutes'
>;

export interface ExtensionSettingsFormProps {
  initial: ExtensionSettingsValues;
  /** Null while signed out: every switch is the user's alone. */
  org: ExtensionOrgSwitches | null;
  onSave: (values: ExtensionSettingsValues) => Promise<void>;
  /** Asks for microphone permission; resolves false when it is refused. */
  requestMicrophone: () => Promise<boolean>;
}
