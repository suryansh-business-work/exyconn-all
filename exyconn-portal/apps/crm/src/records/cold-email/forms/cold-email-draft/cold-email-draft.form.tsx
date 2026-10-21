import { useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { useT } from '@exyconn/i18n';
import { Alert, Text } from '@exyconn/shell/components/ui';
import { RhfSelect, RhfSwitch, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  ColdEmailDraftsDocument,
  ColdEmailTone,
  CrmTimelineDocument,
  CrmTimelineObject,
  useCreateColdEmailDraftMutation,
  useFirecrawlReadyQuery,
} from '@exyconn/shell/graphql/generated';
import { AiWritingProgress } from '../../AiWritingProgress';
import { useToneOptions } from '../../coldEmailTones';
import { readGoal, rememberGoal } from '../../goalMemory';
import {
  coldEmailDraftSchema,
  DRAFT_VARIANT_COUNT,
  type ColdEmailDraftTarget,
  type ColdEmailDraftValues,
} from './cold-email-draft.types';

interface ColdEmailDraftFormProps {
  target: ColdEmailDraftTarget;
  /** The new draft's id, once its first versions are written. */
  onCreated: (draftId: string) => void;
  onCancel: () => void;
}

/**
 * React Hook Form + Zod form that asks the AI for a first cold email to a contact or company:
 * who it goes to, what we are offering, the tone, and whether to read their website first.
 */
export function ColdEmailDraftForm({
  target,
  onCreated,
  onCancel,
}: Readonly<ColdEmailDraftFormProps>) {
  const t = useT();
  const notify = useNotify();
  const toneOptions = useToneOptions();
  const { data: firecrawl } = useFirecrawlReadyQuery();
  const [create] = useCreateColdEmailDraftMutation({
    refetchQueries: [CrmTimelineDocument, ColdEmailDraftsDocument],
  });
  const methods = useForm<ColdEmailDraftValues>({
    mode: 'onTouched',
    resolver: zodResolver(coldEmailDraftSchema),
    defaultValues: {
      toEmail: target.emails[0] ?? '',
      goal: readGoal(),
      tone: ColdEmailTone.Friendly,
      readWebsite: false,
    },
  });
  const canReadWebsite = firecrawl?.firecrawlReady === true && target.website !== '';

  const onSubmit = async (values: ColdEmailDraftValues) => {
    try {
      const { data } = await create({
        variables: {
          input: {
            object:
              target.object === 'CONTACT' ? CrmTimelineObject.Contact : CrmTimelineObject.Company,
            recordId: target.id,
            toEmail: values.toEmail,
            goal: values.goal,
            tone: values.tone,
            readWebsite: canReadWebsite && values.readWebsite,
            variantCount: DRAFT_VARIANT_COUNT,
          },
        },
      });
      rememberGoal(values.goal);
      notify(t('Cold email drafted'), 'success');
      if (data) {
        onCreated(data.createColdEmailDraft.id);
      }
    } catch (error) {
      portalLogger.warn('crm: drafting a cold email failed', error);
      notify(errorMessage(error, t('The AI could not draft the cold email.')), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      submitLabel="Generate"
      onCancel={onCancel}
    >
      {target.emails.length === 0 && (
        <Alert severity="warning">
          {t('{name} has no email address yet. Add one to the record first.', {
            name: target.name,
          })}
        </Alert>
      )}
      <RhfSelect
        name="toEmail"
        label="To"
        options={target.emails.map((address) => ({ value: address, label: address }))}
        helperText="One of the record's email addresses"
      />
      <RhfTextField
        name="goal"
        label="What we are offering"
        multiline
        minRows={3}
        helperText="e.g. a free audit of their checkout. Leave blank to introduce your company."
      />
      <RhfSelect
        name="tone"
        label="Tone"
        options={toneOptions}
        helperText="How the email reads: Friendly, Formal or Brief."
      />
      {canReadWebsite ? (
        <>
          <RhfSwitch name="readWebsite" label="Read their website first" />
          <Text component="p" size="caption" color="text.secondary">
            {t('Reads {site} through Firecrawl, which costs one Firecrawl call.', {
              site: target.website,
            })}
          </Text>
        </>
      ) : (
        <Text component="p" size="caption" color="text.secondary">
          {t(
            'Reading their website needs a website on the record and Firecrawl set up in Tech. A page of theirs scraped earlier is still used.',
          )}
        </Text>
      )}
      <Text component="p" size="caption" color="text.secondary">
        {t('Generating writes {count} versions with the AI in one run and spends AI budget.', {
          count: DRAFT_VARIANT_COUNT,
        })}
      </Text>
      {methods.formState.isSubmitting && <AiWritingProgress count={DRAFT_VARIANT_COUNT} />}
    </EntityForm>
  );
}
