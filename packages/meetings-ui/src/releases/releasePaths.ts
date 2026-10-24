/** Where the Builds page lives in the AI portal. */
export const RELEASES_PATH = '/ai/meeting-assistant/releases';

/** The details page of one extension build. */
export function releaseDetailsPath(id: string): string {
  return `${RELEASES_PATH}/${id}`;
}
