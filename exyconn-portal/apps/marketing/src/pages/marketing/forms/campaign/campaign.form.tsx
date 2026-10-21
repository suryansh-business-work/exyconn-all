import type { TypedDocumentNode } from '@apollo/client';
import { useEffect, useState } from 'react';
import { FormProvider, useWatch } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { useApolloClient } from '@apollo/client/react';
import { useT } from '@exyconn/i18n';
import { Alert, Box, Button, Flex, Heading } from '@exyconn/shell/components/ui';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  GetCampaignDocument,
  type GetCampaignQuery,
  type GetCampaignQueryVariables,
} from '@exyconn/shell/graphql/generated';
import { StudioStepper } from './studio/StudioStepper';
import { StudioFooter } from './studio/StudioFooter';
import { StudioStepContent } from './studio/StudioStepContent';
import { useCampaignDraft } from './studio/useCampaignDraft';
import { useCampaignForm } from './studio/useCampaignForm';
import { useStudioOptions } from './studio/useStudioOptions';
import { useQualityChecks } from './studio/useQualityChecks';
import { useLeaveGuard } from './studio/useLeaveGuard';
import { useCampaignPreview } from './design/useCampaignPreview';
import type { PreviewRecord } from './personalize/PreviewAsField';
import {
  STEP_FIELDS,
  STUDIO_STEPS,
  type CampaignRow,
  type CampaignStudioInput,
  type StudioStep,
} from './campaign.types';

const getCampaignQuery: TypedDocumentNode<GetCampaignQuery, GetCampaignQueryVariables> =
  GetCampaignDocument;

const PREVIEW_STEPS: ReadonlySet<StudioStep> = new Set(['design', 'personalize', 'test']);
const CHECK_STEPS: ReadonlySet<StudioStep> = new Set(['test', 'review']);
const LAST = STUDIO_STEPS.length - 1;

const stepAt = (slug: string | null): StudioStep =>
  STUDIO_STEPS.find((entry) => entry.slug === slug)?.slug ?? 'setup';

interface CampaignFormProps {
  initial: CampaignRow | null;
  onExit: () => void;
}

/**
 * The Email Campaign Studio: setup, audience, design, personalisation, test and review, with
 * the draft saved as you go and the step in the URL. Each step is checked before the next.
 */
export function CampaignForm({ initial, onExit }: Readonly<CampaignFormProps>) {
  const t = useT();
  const confirm = useConfirm();
  const notify = useNotify();
  const client = useApolloClient();
  const options = useStudioOptions();
  const methods = useCampaignForm(initial);
  const { getValues, setValue, trigger, control } = methods;
  const draft = useCampaignDraft(control, initial);
  const [params, setParams] = useSearchParams();
  const step = stepAt(params.get('step'));
  const index = STUDIO_STEPS.findIndex((entry) => entry.slug === step);
  const [reachable, setReachable] = useState(initial ? LAST : index);
  const [busy, setBusy] = useState(false);
  const [previewRecord, setPreviewRecord] = useState<PreviewRecord | null>(null);
  const values = useWatch({ control }) as CampaignStudioInput;
  useLeaveGuard(draft.dirty);

  // A new campaign is sent from the verified address unless somebody picks another.
  const [defaultSender] = options.verifiedSenders;
  useEffect(() => {
    if (defaultSender && !getValues('senderEmail')) setValue('senderEmail', defaultSender);
  }, [defaultSender, getValues, setValue]);

  const preview = useCampaignPreview(
    PREVIEW_STEPS.has(step)
      ? {
          campaignName: values.name,
          senderName: values.senderName,
          subject: values.subject,
          preheader: values.preheader,
          mjml: values.mjml,
          recordKind: previewRecord?.kind ?? null,
          recordId: previewRecord?.id ?? null,
        }
      : null,
  );
  const checks = useQualityChecks(
    CHECK_STEPS.has(step) ? (draft.campaign?.id ?? null) : null,
    values.scheduledAudienceListId,
  );

  const goTo = async (target: StudioStep) => {
    const targetIndex = STUDIO_STEPS.findIndex((entry) => entry.slug === target);
    if (targetIndex > index && !(await trigger(STEP_FIELDS[step]))) return;
    setBusy(true);
    await draft.save();
    setBusy(false);
    setReachable((current) => Math.max(current, targetIndex));
    setParams((current) => {
      const next = new URLSearchParams(current);
      next.set('step', target);
      return next;
    });
  };

  const exit = async () => {
    const saved = await draft.save();
    const leave =
      saved ||
      (await confirm({
        title: 'Leave without saving?',
        message: 'Your latest changes could not be saved and will be lost.',
        confirmText: 'Leave',
        destructive: true,
      }));
    if (leave) onExit();
  };

  const onQueued = () => {
    const id = draft.campaign?.id;
    if (!id) return;
    client
      .query({
        query: getCampaignQuery,
        variables: { id },
        fetchPolicy: 'network-only',
      })
      .then(({ data }) => {
        if (data) draft.refreshed(data.getCampaign);
        checks.run();
      })
      .catch((err: unknown) =>
        notify(errorMessage(err, 'The campaign could not be refreshed'), 'error'),
      );
  };

  return (
    <FormProvider {...methods}>
      <Box
        component="form"
        noValidate
        onSubmit={(event) => event.preventDefault()}
        aria-label={t('Campaign studio')}
      >
        <Flex
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          gap={1}
          flexWrap="wrap"
        >
          <Heading level={2} sx={{ fontSize: 'h5.fontSize' }}>
            {values.name || t('New campaign')}
          </Heading>
          <Button onClick={exit}>{t('Back to campaigns')}</Button>
        </Flex>
        {options.error && <Alert severity="error">{t(options.error)}</Alert>}
        <StudioStepper step={step} reachable={reachable} onSelect={goTo} />
        <Box sx={{ mt: 2 }}>
          <StudioStepContent
            step={step}
            campaign={draft.campaign}
            options={options}
            preview={preview}
            previewRecord={previewRecord}
            onPreviewRecord={setPreviewRecord}
            checks={checks}
            save={draft.save}
            onQueued={onQueued}
          />
        </Box>
        <StudioFooter
          draft={draft}
          isFirst={index === 0}
          isLast={index === LAST}
          busy={busy}
          onBack={() => goTo(STUDIO_STEPS[Math.max(0, index - 1)].slug)}
          onNext={() => goTo(STUDIO_STEPS[Math.min(LAST, index + 1)].slug)}
          onSave={() => {
            draft
              .save()
              .catch((err: unknown) =>
                notify(errorMessage(err, 'The draft could not be saved'), 'error'),
              );
          }}
        />
      </Box>
    </FormProvider>
  );
}
