import type { MaSettingsFieldsFragment, MaSettingsInput } from '@exyconn/shell/graphql/generated';

/** The settings as the page loaded them (with this month's spend and who saved them last). */
export type MeetingSettingsRow = MaSettingsFieldsFragment;

/** What `maUpdateSettings` saves. */
export type MeetingSettingsInput = MaSettingsInput;
