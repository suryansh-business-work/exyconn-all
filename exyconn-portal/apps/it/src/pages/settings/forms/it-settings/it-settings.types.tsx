import type { ItSettingsFieldsFragment, ItSettingsInput } from '@exyconn/shell/graphql/generated';

/** The saved settings, as the generated fragment types them. */
export type ItSettingsRow = ItSettingsFieldsFragment;

/** What the form edits — the generated input, unchanged. */
export type ItSettingsValues = ItSettingsInput;
