import { useCallback } from 'react';
import { useRevealTechSecretMutation, type TechSecret } from '@exyconn/shell/graphql/generated';

/** Fetches one saved credential for an eye button; undefined on a new config, which has none. */
export type TechRevealFor = (secret: TechSecret) => (() => Promise<string>) | undefined;

/** The eye buttons' reveal for the config being edited. The server audits every reveal. */
export function useTechSecretReveal(configId: string | undefined): TechRevealFor {
  const [revealSecret] = useRevealTechSecretMutation({ fetchPolicy: 'no-cache' });
  return useCallback(
    (secret) => {
      if (!configId) {
        return undefined;
      }
      return async () => {
        const { data } = await revealSecret({ variables: { id: configId, secret } });
        return data?.revealTechSecret ?? '';
      };
    },
    [configId, revealSecret],
  );
}
