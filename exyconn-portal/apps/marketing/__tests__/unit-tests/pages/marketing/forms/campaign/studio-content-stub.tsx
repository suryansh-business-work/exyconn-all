import { useFormContext } from 'react-hook-form';
import { Button } from '@exyconn/shell/components/ui';
import type { StudioStepContentProps } from '../../../../../../src/pages/marketing/forms/campaign/studio/StudioStepContent';
import type { CampaignStudioValues } from '../../../../../../src/pages/marketing/forms/campaign/campaign.types';
import { CONTACT } from './studio.fixtures';

/**
 * Stands in for the step screens (each has its own tests): shows what the studio handed the
 * current step and offers buttons for what a step does — fill its fields, pick a recipient,
 * save, report a queued send — so the studio's own flow is what is tested.
 */
export function StudioStepContent({
  step,
  campaign,
  preview,
  checks,
  onPreviewRecord,
  save,
  onQueued,
}: Readonly<StudioStepContentProps>) {
  const { setValue, formState } = useFormContext<CampaignStudioValues>();
  const fill = () => {
    setValue('name', 'Diwali offer');
    setValue('senderName', 'Exyconn');
    setValue('subject', 'Festive savings');
  };
  return (
    <section aria-label="Step content">
      <output aria-label="Current step">{step}</output>
      <output aria-label="Campaign id">{campaign?.id ?? 'none'}</output>
      <output aria-label="Preview">{preview.preview?.subject ?? 'none'}</output>
      <output aria-label="Checks">{checks.report ? 'report' : 'none'}</output>
      <output aria-label="Errors">{Object.keys(formState.errors).join()}</output>
      <Button onClick={fill}>Fill setup</Button>
      <Button onClick={() => setValue('scheduledAudienceListId', 'audience-1')}>
        Pick audience
      </Button>
      <Button onClick={() => onPreviewRecord(CONTACT)}>Preview as contact</Button>
      <Button onClick={() => save()}>Step save</Button>
      <Button onClick={onQueued}>Report queued</Button>
    </section>
  );
}
