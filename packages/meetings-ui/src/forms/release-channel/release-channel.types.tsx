import type { MaReleaseChannel } from '@exyconn/shell/graphql/generated';

/** The one choice: which release channel a build goes to. */
export interface ReleaseChannelValues {
  channel: MaReleaseChannel;
}
