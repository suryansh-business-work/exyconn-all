import { useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { useCompanyCurrency } from '@exyconn/shell/components/form/rhf';
import {
  campaignSchema,
  toStudioValues,
  type CampaignRow,
  type CampaignStudioInput,
  type CampaignStudioValues,
} from '../campaign.types';

/**
 * The studio's React Hook Form, validated by the campaign schema. A new campaign's budget is
 * set in the company's currency until somebody picks another.
 */
export function useCampaignForm(initial: CampaignRow | null) {
  const companyCurrency = useCompanyCurrency();
  return useForm<CampaignStudioInput, unknown, CampaignStudioValues>({
    mode: 'onTouched',
    resolver: zodResolver(campaignSchema),
    defaultValues: toStudioValues(initial, '', companyCurrency),
  });
}
