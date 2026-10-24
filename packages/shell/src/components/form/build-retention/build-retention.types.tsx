/** The most builds retention can keep — the server's own limit for every product. */
export const MAX_KEEP_LATEST_BUILDS = 500;

export interface BuildRetentionFormProps {
  /** The stored count the form starts from (0 keeps every build). */
  keepLatestBuilds: number;
  /** Saves the new count; a rejection is shown to the person as the save's failure. */
  save: (keepLatestBuilds: number) => Promise<unknown>;
}
