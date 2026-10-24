import type { TrackerBuildSettingsQuery } from '@exyconn/shell/graphql/generated';

/** The stored count the form starts from. */
export type BuildRetentionFormProps = Pick<
  TrackerBuildSettingsQuery['trackerBuildSettings'],
  'keepLatestBuilds'
>;
