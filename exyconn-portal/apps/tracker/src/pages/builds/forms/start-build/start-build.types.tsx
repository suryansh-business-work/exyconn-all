import type { TrackerPlatform, TrackerVersionBump } from '@exyconn/shell/graphql/generated';

/** Form values for starting a tracker build. */
export interface StartBuildFormValues {
  platforms: TrackerPlatform[];
  bump: TrackerVersionBump;
  ref: string;
}
