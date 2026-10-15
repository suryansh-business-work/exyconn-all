import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useDeleteCrmPropertyMutation, type CrmObject } from '@exyconn/shell/graphql/generated';
import { propertyRefetches } from './property-types';
import type { CrmPropertyRow } from './forms/crm-property';

/**
 * Confirms, then deletes a custom property. Deleting it also wipes its value from every record
 * of the type, so the prompt says so plainly and the button is the destructive one.
 */
export function useRemoveProperty(object: CrmObject) {
  const confirm = useConfirm();
  const notify = useNotify();
  const [deleteProperty] = useDeleteCrmPropertyMutation({
    refetchQueries: propertyRefetches(object),
    awaitRefetchQueries: true,
  });

  return async (property: CrmPropertyRow): Promise<void> => {
    const ok = await confirm({
      title: 'Delete property?',
      message:
        'Delete "{label}"? Its value is removed from every record that has one. This cannot be undone.',
      messageValues: { label: property.label },
      confirmText: 'Delete',
      destructive: true,
    });
    if (!ok) {
      return;
    }
    try {
      await deleteProperty({ variables: { id: property.id } });
      notify('Property "{label}" deleted', 'success', { label: property.label });
    } catch (error) {
      portalLogger.warn('Could not delete a CRM property', error, { object });
      notify(errorMessage(error, 'Could not delete the property'), 'error');
    }
  };
}
