import type { TrackerBuildReleasesQuery } from '@exyconn/shell/graphql/generated';

/** One published tracker build, as the Builds table and details page read it. */
export type TrackerBuildReleaseRow = TrackerBuildReleasesQuery['trackerBuildReleases'][number];

/** Where a build's details open; `:id` is GitHub's release id. */
export const BUILD_DETAILS_PATH = '/tracker/builds/release';

/** The details page of one build. */
export function buildDetailsPath(id: string): string {
  return `${BUILD_DETAILS_PATH}/${id}`;
}

/** Every installer URL of the given builds, newest build first. */
export function installerUrls(rows: readonly TrackerBuildReleaseRow[]): string[] {
  return rows.flatMap((row) => row.assets.map((asset) => asset.url));
}
