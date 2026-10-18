import {
  CrmTimelineObject,
  useCrmEmailSenderQuery,
  useCrmEmailSendersQuery,
} from '@exyconn/shell/graphql/generated';
import type { SelectOption } from '@exyconn/shell/components/form/rhf';
import { PROVIDER_NAMES } from '../../../../integrations/providerNames';
import type { ComposeEmailContext } from './compose-email.types';

/**
 * The Gmail and Microsoft mailboxes an email may go from (the server lists only enabled,
 * connected ones), and which one to start on: the thread's own account for a reply, else the
 * one that last wrote to the record, else the first.
 */
export function useComposeSender(context: ComposeEmailContext) {
  const { data, loading } = useCrmEmailSendersQuery({ fetchPolicy: 'cache-and-network' });
  const { data: sender } = useCrmEmailSenderQuery({
    variables: {
      object: context.object === 'CONTACT' ? CrmTimelineObject.Contact : CrmTimelineObject.Company,
      id: context.id,
    },
    skip: Boolean(context.fromAccountId),
  });
  const options: SelectOption[] = (data?.crmEmailSenders ?? []).map((mailbox) => ({
    value: mailbox.id,
    label: `${mailbox.email} (${PROVIDER_NAMES[mailbox.provider] ?? mailbox.provider})`,
  }));
  const usable = new Set(options.map((option) => option.value));
  const preferred =
    [context.fromAccountId, sender?.crmEmailSender].find((id) => id && usable.has(id)) ??
    options[0]?.value ??
    '';
  return { options, preferred, loading: loading && !data };
}
