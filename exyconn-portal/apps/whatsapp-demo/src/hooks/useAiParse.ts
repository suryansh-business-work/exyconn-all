import { useCallback } from 'react';
import {
  useWhatsappDemoAiStatusQuery,
  useWhatsappDemoParseMutation,
} from '@exyconn/shell/graphql/generated';
import type { AiRequest, AiResult } from '@exyconn/wa-flow';

/**
 * Free text the engine cannot read on its own goes to the portal's OpenAI reader. Null when
 * OpenAI is not set up or the call failed — the workflow then follows its "not understood" path.
 */
export function useAiParse(sessionId: string) {
  const { data } = useWhatsappDemoAiStatusQuery({ fetchPolicy: 'cache-first' });
  const [parse] = useWhatsappDemoParseMutation();
  const configured = data?.whatsappDemoAiStatus.configured ?? false;

  const read = useCallback(
    async (request: AiRequest, demoKey: string): Promise<AiResult> => {
      const { data: reply } = await parse({
        variables: {
          input: {
            sessionId,
            demoKey,
            workflow: request.workflow,
            node: request.node,
            text: request.text,
            intents: request.intents,
            entities: request.entities,
          },
        },
      });
      const result = reply?.whatsappDemoParse;
      if (!result?.ok) {
        return null;
      }
      return {
        intent: result.intent ?? null,
        entities: (result.entities ?? {}) as Record<string, string>,
      };
    },
    [parse, sessionId],
  );

  return { configured, read };
}
