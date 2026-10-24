import {
  ColdEmailDraftsDocument,
  CrmEmailThreadPageDocument,
  CrmTimelineDocument,
  useSendColdEmailVariantMutation,
} from '@exyconn/shell/graphql/generated';
import { ComposeEmailForm, type ComposeEmailValues } from '../../detail/forms/compose-email';
import type { ColdEmailSend, CommsPanel } from '../commsStore';

interface ColdEmailPanelProps {
  panel: CommsPanel;
  coldEmail: ColdEmailSend;
  onClose: () => void;
}

/**
 * A cold email version in the compose form, prefilled and addressed to the draft's recipient.
 * It is sent through `sendColdEmailVariant`, so the version is marked sent and linked to the
 * message on the record's Emails tab and timeline — the tracking cannot be skipped.
 */
export function ColdEmailPanel({ panel, coldEmail, onClose }: Readonly<ColdEmailPanelProps>) {
  const [sendVariant] = useSendColdEmailVariantMutation({
    refetchQueries: [CrmEmailThreadPageDocument, CrmTimelineDocument, ColdEmailDraftsDocument],
  });
  const send = async (values: ComposeEmailValues) => {
    await sendVariant({
      variables: {
        input: {
          draftId: coldEmail.draftId,
          variantId: coldEmail.variantId,
          fromAccountId: values.fromAccountId,
          subject: values.subject,
          body: values.body,
        },
      },
    });
  };
  return (
    <ComposeEmailForm
      context={{
        object: panel.object,
        id: panel.id,
        to: panel.emails,
        subject: coldEmail.subject,
        body: coldEmail.body,
        recipientsLocked: true,
      }}
      memoryKey={panel.key}
      send={send}
      onDone={onClose}
      onCancel={onClose}
    />
  );
}
