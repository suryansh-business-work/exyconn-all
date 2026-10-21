import { useT } from '@exyconn/i18n';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  CrmTimelineObject,
  useDeleteColdEmailVariantMutation,
  type ColdEmailDraftFieldsFragment,
  type ColdEmailVariantFieldsFragment,
} from '@exyconn/shell/graphql/generated';
import { openComms } from '../comms';

/** Deleting a version (after a confirm) and opening one in the email dock to send it. */
export function useVariantActions(draft: ColdEmailDraftFieldsFragment) {
  const t = useT();
  const confirm = useConfirm();
  const notify = useNotify();
  const [deleteVariant, { loading: deleting }] = useDeleteColdEmailVariantMutation();

  const remove = async (variant: ColdEmailVariantFieldsFragment) => {
    const ok = await confirm({
      title: 'Delete version',
      message: 'Delete the version "{subject}"? It cannot be brought back.',
      messageValues: { subject: variant.subject },
      confirmText: 'Delete',
      destructive: true,
    });
    if (!ok) {
      return;
    }
    try {
      await deleteVariant({ variables: { draftId: draft.id, variantId: variant.id } });
      notify(t('Version deleted'), 'success');
    } catch (error) {
      portalLogger.warn('crm: deleting a cold email version failed', error);
      notify(errorMessage(error, t('Could not delete the version.')), 'error');
    }
  };

  /** Opens the email dock prefilled; sending from there marks this version sent. */
  const use = (variant: ColdEmailVariantFieldsFragment) =>
    openComms({
      channel: 'EMAIL',
      object: draft.object === CrmTimelineObject.Contact ? 'CONTACT' : 'COMPANY',
      id: draft.recordId,
      name: draft.recordName,
      phones: [],
      emails: [draft.toEmail],
      coldEmail: {
        draftId: draft.id,
        variantId: variant.id,
        subject: variant.subject,
        body: variant.body,
      },
    });

  return { remove, use, deleting };
}
