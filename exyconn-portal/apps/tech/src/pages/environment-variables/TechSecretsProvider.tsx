import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from 'react';
import { useRevealAllTechSecretsMutation, type TechSecret } from '@exyconn/shell/graphql/generated';

/** Every saved credential on the page, by `<secret>:<config id>`. */
type SecretValues = ReadonlyMap<string, string>;

export interface TechSecretsStore {
  /** The saved value of one credential of one config; '' when none is saved. */
  valueOf: (secret: TechSecret, configId: string) => Promise<string>;
  /** Forgets the loaded values, so the next look reads them again (after a save). */
  invalidate: () => void;
}

const TechSecretsContext = createContext<TechSecretsStore | null>(null);

const keyOf = (secret: string, configId: string) => `${secret}:${configId}`;

/**
 * Holds every saved credential of Environment Variables in memory — one audited request the first
 * time an eye button is pressed, then every eye shows its value at once. Never written to storage;
 * leaving the page forgets them.
 */
export function TechSecretsProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [revealAll] = useRevealAllTechSecretsMutation({ fetchPolicy: 'no-cache' });
  const loaded = useRef<Promise<SecretValues> | null>(null);

  const load = useCallback(() => {
    loaded.current ??= revealAll().then(
      ({ data }) =>
        new Map(
          (data?.revealAllTechSecrets ?? []).map((item) => [
            keyOf(item.secret, item.id),
            item.value,
          ]),
        ),
      (error: unknown) => {
        // A failed load is not kept: the next eye press asks again.
        loaded.current = null;
        throw error;
      },
    );
    return loaded.current;
  }, [revealAll]);

  const store = useMemo<TechSecretsStore>(
    () => ({
      valueOf: async (secret, configId) => (await load()).get(keyOf(secret, configId)) ?? '',
      invalidate: () => {
        loaded.current = null;
      },
    }),
    [load],
  );

  return <TechSecretsContext.Provider value={store}>{children}</TechSecretsContext.Provider>;
}

/** The page's secrets store; a form outside Environment Variables has none. */
export function useTechSecrets(): TechSecretsStore {
  const store = useContext(TechSecretsContext);
  if (!store) {
    throw new Error('useTechSecrets is used outside TechSecretsProvider');
  }
  return store;
}
