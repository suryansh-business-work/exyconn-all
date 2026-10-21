import { useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { useT } from '@exyconn/i18n';
import { Text } from '@exyconn/shell/components/ui';
import { RhfSwitch } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  ColdEmailDraftsDocument,
  CrmTimelineDocument,
  useFirecrawlReadyQuery,
  useRewriteColdEmailDraftMutation,
  type ColdEmailDraftFieldsFragment,
} from '@exyconn/shell/graphql/generated';
import { AiWritingProgress } from '../../AiWritingProgress';
import { rewriteDraftSchema, type RewriteDraftValues } from './rewrite-draft.types';

interface RewriteDraftFormProps {
  draftId: string;
  /** How many new versions this rewrite writes: up to 4, within the draft's room. */
  count: number;
  /** The draft with its new versions. */
  onDone: (draft: ColdEmailDraftFieldsFragment) => void;
  onCancel: () => void;
}

/**
 * React Hook Form + Zod form that rewrites a draft from the record's latest data (its profile,
 * the newest timeline entries and, when asked, their website read again), as new versions.
 */
export function RewriteDraftForm({
  draftId,
  count,
  onDone,
  onCancel,
}: Readonly<RewriteDraftFormProps>) {
  const t = useT();
  const notify = useNotify();
  const { data: firecrawl } = useFirecrawlReadyQuery();
  const [rewrite] = useRewriteColdEmailDraftMutation({
    refetchQueries: [ColdEmailDraftsDocument, CrmTimelineDocument],
  });
  const methods = useForm<RewriteDraftValues>({
    mode: 'onTouched',
    resolver: zodResolver(rewriteDraftSchema),
    defaultValues: { readWebsite: false },
  });
  const canReadWebsite = firecrawl?.firecrawlReady === true;

  const onSubmit = async (values: RewriteDraftValues) => {
    try {
      const { data } = await rewrite({
        variables: { id: draftId, readWebsite: canReadWebsite && values.readWebsite },
      });
      notify(t('New versions written from the latest data'), 'success');
      if (data) {
        onDone(data.rewriteColdEmailDraft);
      }
    } catch (error) {
      portalLogger.warn('crm: rewriting a cold email draft failed', error);
      notify(errorMessage(error, t('The AI could not rewrite the cold email.')), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      submitLabel="Rewrite"
      onCancel={onCancel}
    >
      <Text component="p" size="sm" sx={{ m: 0 }}>
        {t(
          'The AI reads the record again, with its latest activity, and writes {count} new versions. The current versions stay.',
          { count },
        )}
      </Text>
      {canReadWebsite && (
        <>
          <RhfSwitch name="readWebsite" label="Read their website again" />
          <Text component="p" size="caption" color="text.secondary">
            {t(
              'Reads their website through Firecrawl, which costs one Firecrawl call. Otherwise a page scraped earlier is used.',
            )}
          </Text>
        </>
      )}
      <Text component="p" size="caption" color="text.secondary">
        {t('Rewriting runs the AI once and spends AI budget.')}
      </Text>
      {methods.formState.isSubmitting && <AiWritingProgress count={count} />}
    </EntityForm>
  );
}
