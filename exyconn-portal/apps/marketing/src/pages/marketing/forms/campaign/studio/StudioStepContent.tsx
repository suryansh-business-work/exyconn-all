import { SetupStep } from '../steps/SetupStep';
import { AudienceStep } from '../steps/AudienceStep';
import { DesignStep } from '../steps/DesignStep';
import { PersonalizeStep } from '../steps/PersonalizeStep';
import { TestStep } from '../steps/TestStep';
import { ReviewStep } from '../steps/ReviewStep';
import type { CampaignPreviewState } from '../design/useCampaignPreview';
import type { PreviewRecord } from '../personalize/PreviewAsField';
import type { CampaignRow, StudioStep } from '../campaign.types';
import type { StudioOptions } from './useStudioOptions';
import type { useQualityChecks } from './useQualityChecks';

export interface StudioStepContentProps {
  step: StudioStep;
  campaign: CampaignRow | null;
  options: StudioOptions;
  preview: CampaignPreviewState;
  previewRecord: PreviewRecord | null;
  onPreviewRecord: (record: PreviewRecord | null) => void;
  checks: ReturnType<typeof useQualityChecks>;
  save: () => Promise<unknown>;
  onQueued: () => void;
}

/** The current step's screen. */
export function StudioStepContent(props: Readonly<StudioStepContentProps>) {
  const {
    step,
    campaign,
    options,
    preview,
    previewRecord,
    onPreviewRecord,
    checks,
    save,
    onQueued,
  } = props;
  switch (step) {
    case 'setup':
      return <SetupStep options={options} campaign={campaign} />;
    case 'audience':
      return <AudienceStep />;
    case 'design':
      return <DesignStep options={options} preview={preview} />;
    case 'personalize':
      return (
        <PersonalizeStep
          options={options}
          preview={preview}
          previewRecord={previewRecord}
          onPreviewRecord={onPreviewRecord}
        />
      );
    case 'test':
      return (
        <TestStep
          campaignId={campaign?.id ?? null}
          preview={preview}
          previewRecord={previewRecord}
          checks={checks}
          save={save}
        />
      );
    default:
      return (
        <ReviewStep
          campaign={campaign}
          options={options}
          checks={checks}
          save={save}
          onQueued={onQueued}
        />
      );
  }
}
