import { useCallback, useEffect } from 'react';
import type { TechSecret } from '@exyconn/shell/graphql/generated';
import { useTechSecrets } from './TechSecretsProvider';

/** Reads one saved credential for an eye button; undefined on a new config, which has none. */
export type TechRevealFor = (secret: TechSecret) => (() => Promise<string>) | undefined;

/**
 * The eye buttons' reveal for the config being edited, read from the values the page holds in
 * memory. When the form closes — after a save, say — the page reads them again on the next look,
 * so a key just saved shows as saved.
 */
export function useTechSecretReveal(configId: string | undefined): TechRevealFor {
  const { valueOf, invalidate } = useTechSecrets();
  useEffect(() => invalidate, [invalidate]);
  return useCallback(
    (secret) => {
      if (!configId) {
        return undefined;
      }
      return () => valueOf(secret, configId);
    },
    [configId, valueOf],
  );
}
