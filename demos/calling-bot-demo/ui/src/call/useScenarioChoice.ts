import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCallingBotScenarioOptionsQuery } from '@exyconn/shell/graphql/generated';

/** The URL parameter the picked example rides on, so a link can open the demo on one. */
const PARAM = 'example';

/**
 * The example call the visitor picked (Tech > Demos > Calling bot > Examples), kept in the
 * address so the browser call and the phone call play the same one, and a shared link opens on
 * it. No pick (or one no longer offered) means the bot's own settings.
 */
export function useScenarioChoice() {
  const [params, setParams] = useSearchParams();
  const { data, error } = useCallingBotScenarioOptionsQuery({
    fetchPolicy: 'cache-and-network',
  });
  const scenarios = data?.callingBotScenarioOptions ?? [];
  const wanted = params.get(PARAM);
  const selected = scenarios.find((scenario) => scenario.id === wanted) ?? null;

  const select = useCallback(
    (id: string) => {
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          if (id) {
            next.set(PARAM, id);
          } else {
            next.delete(PARAM);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  return { scenarios, selected, select, failed: Boolean(error) };
}
