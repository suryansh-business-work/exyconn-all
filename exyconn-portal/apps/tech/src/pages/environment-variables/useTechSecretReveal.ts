import { useCallback, useEffect } from 'react';
import { useRevealAllTechSecretsMutation, type TechSecret } from '@exyconn/shell/graphql/generated';
import { forgetTechSecrets, loadTechSecrets, secretKeyOf } from './techSecretsCache';

/** Reads one saved credential for an eye button; undefined on a new config, which has none. */
export type TechRevealFor = (secret: TechSecret) => (() => Promise<string>) | undefined;

/**
 * The eye buttons' reveal for the config being edited, read from every saved credential loaded
 * once (techSecretsCache). When the form closes — after a save, say — the values are forgotten,
 * so a key just saved shows as saved on the next look.
 */
export function useTechSecretReveal(configId: string | undefined): TechRevealFor {
  const [revealAll] = useRevealAllTechSecretsMutation({ fetchPolicy: 'no-cache' });
  useEffect(() => forgetTechSecrets, []);
  return useCallback(
    (secret) => {
      if (!configId) {
        return undefined;
      }
      return async () =>
        (await loadTechSecrets(() => revealAll())).get(secretKeyOf(secret, configId)) ?? '';
    },
    [configId, revealAll],
  );
}
