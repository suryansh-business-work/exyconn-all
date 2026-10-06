import { useRef } from 'react';
import { useT } from '@exyconn/i18n';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  useCreateClientMutation,
  useSetClientProjectsMutation,
  useUpdateClientMutation,
} from '@exyconn/shell/graphql/generated';
import { toClientInput, type ClientFormValues, type ClientRow } from './client.types';

/**
 * Saves the client, then links exactly the chosen projects to it. The two are separate calls:
 * when the client saves but the projects do not, the form stays open, and saving again updates
 * the client just created rather than creating a second one.
 */
export function useClientSave(initial: ClientRow | null, onDone: () => void) {
  const t = useT();
  const notify = useNotify();
  const [createClient] = useCreateClientMutation();
  const [updateClient] = useUpdateClientMutation();
  const [setClientProjects] = useSetClientProjectsMutation();
  const createdId = useRef<string | null>(null);

  const saveClient = async (values: ClientFormValues): Promise<string | undefined> => {
    const input = toClientInput(values);
    const id = initial?.id ?? createdId.current;
    if (id) {
      await updateClient({ variables: { id, input } });
      return id;
    }
    const result = await createClient({ variables: { input } });
    createdId.current = result.data?.createClient.id ?? null;
    return result.data?.createClient.id;
  };

  return async (values: ClientFormValues) => {
    let clientId: string | undefined;
    try {
      clientId = await saveClient(values);
    } catch (error) {
      notify(errorMessage(error, 'Save failed'), 'error');
      return;
    }
    if (!clientId) {
      notify('Save failed', 'error');
      return;
    }
    try {
      await setClientProjects({ variables: { clientId, projectIds: values.projectIds } });
    } catch (error) {
      notify('The client was saved, but its projects could not be linked: {reason}', 'error', {
        reason: errorMessage(error, t('Could not change the project')),
      });
      return;
    }
    notify(initial ? '{entity} updated' : '{entity} created', 'success', { entity: t('Client') });
    onDone();
  };
}
