import { useCallback } from 'react';
import {
  useRevealCallingBotSecretMutation,
  type CallingBotSecret,
} from '@exyconn/shell/graphql/generated';

/** Fetches one saved key for an eye button; undefined on a new config, which has none saved. */
export type RevealFor = (secret: CallingBotSecret) => (() => Promise<string>) | undefined;

/** The eye buttons' reveal for the config being edited. The server audits every reveal. */
export function useSecretReveal(configId: string | undefined): RevealFor {
  const [revealSecret] = useRevealCallingBotSecretMutation({ fetchPolicy: 'no-cache' });
  return useCallback(
    (secret) => {
      if (!configId) {
        return undefined;
      }
      return async () => {
        const { data } = await revealSecret({ variables: { id: configId, secret } });
        return data?.revealCallingBotSecret ?? '';
      };
    },
    [configId, revealSecret],
  );
}
