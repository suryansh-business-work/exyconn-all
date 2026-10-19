import { useT } from '@exyconn/i18n';
import { PreviewPane } from '../marketing/forms/campaign/design/PreviewPane';
import { useCampaignPreview } from '../marketing/forms/campaign/design/useCampaignPreview';
import type { CampaignTemplateRow } from '../marketing/forms/campaign-template';

/** A template rendered with sample data, by the same pipeline a send uses. */
export function TemplatePreview({ template }: Readonly<{ template: CampaignTemplateRow }>) {
  const t = useT();
  const preview = useCampaignPreview({
    campaignName: template.name,
    senderName: t('Your team'),
    subject: template.name,
    preheader: template.description,
    mjml: template.mjml,
  });
  return <PreviewPane state={preview} />;
}
