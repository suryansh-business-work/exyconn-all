import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { useT } from '@exyconn/i18n';
import { Text } from '@exyconn/shell/components/ui';
import {
  RhfDateTimePicker,
  RhfImageField,
  RhfMultiSelect,
  RhfSelect,
  RhfTextField,
  type SelectOption,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  useComposeSocialMediaPostMutation,
  useUpdateSocialMediaPostMutation,
  type SocialNetwork,
} from '@exyconn/shell/graphql/generated';
import { NETWORK_LABEL, accountLabel } from '../../social.labels';
import {
  makeSocialPostSchema,
  postLength,
  toFormValues,
  type SocialPostValues,
} from './social-post.schema';
import type { NetworkRule, SocialMediaPostRow } from './social-post.types';

interface ComposeAccount {
  id: string;
  name: string;
  network: SocialNetwork;
}

interface SocialPostFormProps {
  accounts: readonly ComposeAccount[];
  rules: readonly NetworkRule[];
  /** The post being edited, or null to write a new one. */
  initial: SocialMediaPostRow | null;
  onDone: () => void;
  onCancel: () => void;
}

const NEW_TIMING: SelectOption[] = [
  { value: 'NOW', label: 'Publish now' },
  { value: 'SCHEDULE', label: 'Schedule for later' },
  { value: 'DRAFT', label: 'Save as a draft' },
];
const EDIT_TIMING = NEW_TIMING.filter((option) => option.value !== 'NOW');

/** React Hook Form + Zod composer: one post to several accounts, now, later or as a draft. */
export function SocialPostForm({
  accounts,
  rules,
  initial,
  onDone,
  onCancel,
}: Readonly<SocialPostFormProps>) {
  const t = useT();
  const notify = useNotify();
  const [compose] = useComposeSocialMediaPostMutation();
  const [update] = useUpdateSocialMediaPostMutation();
  const networkOf = useMemo(() => new Map(accounts.map((a) => [a.id, a.network])), [accounts]);
  const ruleOf = useMemo(() => {
    const byNetwork = new Map(rules.map((rule) => [rule.network, rule]));
    return (accountId: string) => {
      const network = networkOf.get(accountId);
      return network ? byNetwork.get(network) : undefined;
    };
  }, [rules, networkOf]);
  const schema = useMemo(() => makeSocialPostSchema(ruleOf), [ruleOf]);
  const methods = useForm<z.input<typeof schema>, unknown, SocialPostValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(initial),
  });
  const [accountIds, text, link, timing] = methods.watch(['accountIds', 'text', 'link', 'timing']);

  const publishable = accounts.filter((account) => ruleOf(account.id)?.canPublish);
  const options = publishable.map((account) => ({
    value: account.id,
    label: accountLabel(account),
  }));
  const length = postLength(text, link);
  const limits = [...new Set(accountIds.map((id) => networkOf.get(id)).filter(Boolean))]
    .map(
      (network) =>
        `${NETWORK_LABEL[network as SocialNetwork]} ${length}/${rules.find((r) => r.network === network)?.maxChars ?? '–'}`,
    )
    .join(' · ');

  const onSubmit = async (values: SocialPostValues) => {
    const scheduledAt = values.timing === 'SCHEDULE' ? values.scheduledAt : null;
    const draft = { text: values.text, mediaUrl: values.mediaUrl, link: values.link, scheduledAt };
    try {
      if (initial) {
        await update({ variables: { id: initial.id, input: draft } });
        notify('Post updated');
      } else {
        const { data } = await compose({
          variables: {
            input: { ...draft, accountIds: values.accountIds, draft: values.timing === 'DRAFT' },
          },
        });
        const failed = (data?.composeSocialMediaPost ?? []).filter(
          (post) => post.status === 'FAILED',
        );
        if (failed.length > 0) {
          notify(
            failed.map((post) => `${NETWORK_LABEL[post.network]}: ${post.error}`).join(' '),
            'error',
          );
        } else {
          notify(values.timing === 'NOW' ? 'Posted' : 'Saved');
        }
      }
      onDone();
    } catch (error) {
      notify(errorMessage(error, 'Could not save the post'), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={Boolean(initial)}
      onCancel={onCancel}
      submitLabel={initial ? 'Save' : 'Post'}
    >
      {initial ? null : (
        <RhfMultiSelect
          name="accountIds"
          label="Post to"
          options={options}
          helperText={
            options.length ? undefined : 'Connect an account that takes posts first (Accounts tab).'
          }
        />
      )}
      <RhfTextField
        name="text"
        label="Text"
        multiline
        minRows={4}
        helperText={limits || 'Pick accounts to see each network’s limit.'}
      />
      <RhfImageField
        name="mediaUrl"
        label="Image"
        folder="social"
        helperText="Instagram needs one; Facebook can carry one. X and LinkedIn posts from here are text only."
      />
      <RhfTextField
        name="link"
        label="Link"
        helperText="Optional. Added to the end of the text where the network has no link field."
      />
      <RhfSelect name="timing" label="When" options={initial ? EDIT_TIMING : NEW_TIMING} />
      {timing === 'SCHEDULE' && (
        <RhfDateTimePicker
          name="scheduledAt"
          label="Publish at"
          helperText="In your own timezone. It goes out within a minute of this time."
        />
      )}
      {accountIds.map((id) => ruleOf(id)).filter(Boolean).length > 0 && (
        <Text size="caption" color="text.secondary">
          {[...new Set(accountIds.map((id) => ruleOf(id)?.note).filter(Boolean))]
            .map((note) => t(String(note)))
            .join(' ')}
        </Text>
      )}
    </EntityForm>
  );
}
