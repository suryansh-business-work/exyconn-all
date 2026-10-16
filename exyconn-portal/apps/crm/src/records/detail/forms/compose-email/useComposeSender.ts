import {
  CrmTimelineObject,
  GmailAccountStatus,
  useCrmEmailSenderQuery,
  useGmailAccountsQuery,
} from '@exyconn/shell/graphql/generated';
import type { SelectOption } from '@exyconn/shell/components/form/rhf';
import type { ComposeEmailContext } from './compose-email.types';

/**
 * The accounts an email may go from (enabled and connected), and which one to start on: the
 * thread's own account for a reply, else the one that last wrote to the record, else the first.
 */
export function useComposeSender(context: ComposeEmailContext) {
  const { data, loading } = useGmailAccountsQuery({ fetchPolicy: 'cache-and-network' });
  const { data: sender } = useCrmEmailSenderQuery({
    variables: {
      object: context.object === 'CONTACT' ? CrmTimelineObject.Contact : CrmTimelineObject.Company,
      id: context.id,
    },
    skip: Boolean(context.fromAccountId),
  });
  const options: SelectOption[] = (data?.gmailAccounts ?? [])
    .filter((account) => account.enabled && account.status === GmailAccountStatus.Connected)
    .map((account) => ({ value: account.id, label: account.email }));
  const usable = new Set(options.map((option) => option.value));
  const preferred =
    [context.fromAccountId, sender?.crmEmailSender].find((id) => id && usable.has(id)) ??
    options[0]?.value ??
    '';
  return { options, preferred, loading: loading && !data };
}
