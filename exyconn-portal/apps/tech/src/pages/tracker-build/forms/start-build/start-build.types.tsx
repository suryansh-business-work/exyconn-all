import type { TrackerPlatform } from '@exyconn/shell/graphql/generated';

/** Form values for starting a tracker build. */
export interface StartBuildFormValues {
  platforms: TrackerPlatform[];
  ref: string;
}
