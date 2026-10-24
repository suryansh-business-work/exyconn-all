import type { RevealAllTechSecretsMutation } from '@exyconn/shell/graphql/generated';

/** Every saved credential, by `<secret>:<config id>`. */
type SecretValues = ReadonlyMap<string, string>;

/** Asks the server for every saved credential (one audited request). */
export type RevealAll = () => Promise<{ data?: RevealAllTechSecretsMutation | null }>;

let loaded: Promise<SecretValues> | null = null;

export const secretKeyOf = (secret: string, configId: string) => `${secret}:${configId}`;

/**
 * Every saved credential, read once and kept in memory — never in storage — so each eye button
 * shows its value without asking again. A failed read is not kept: the next look asks again.
 */
export function loadTechSecrets(revealAll: RevealAll): Promise<SecretValues> {
  loaded ??= revealAll().then(
    ({ data }) =>
      new Map(
        (data?.revealAllTechSecrets ?? []).map((item) => [
          secretKeyOf(item.secret, item.id),
          item.value,
        ]),
      ),
    (error: unknown) => {
      loaded = null;
      throw error;
    },
  );
  return loaded;
}

/** Forgets the values, so the next look reads them again (after a save, or signing out). */
export function forgetTechSecrets(): void {
  loaded = null;
}
