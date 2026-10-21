import { useEffect, type ReactNode } from 'react';
import { FormProvider, useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import {
  campaignSchema,
  toStudioValues,
  type CampaignStudioInput,
  type CampaignStudioValues,
} from '../../../../../../src/pages/marketing/forms/campaign/campaign.types';

export type StudioForm = UseFormReturn<CampaignStudioInput, unknown, CampaignStudioValues>;

interface StudioFormHarnessProps {
  children: ReactNode;
  values?: Partial<CampaignStudioInput>;
  /** Handed the form once, so a test can read or set values and trigger validation. */
  onForm?: (form: StudioForm) => void;
}

/** The studio's form context around a step, as CampaignForm provides it. */
export function StudioFormHarness({ children, values, onForm }: Readonly<StudioFormHarnessProps>) {
  const form = useForm<CampaignStudioInput, unknown, CampaignStudioValues>({
    mode: 'onTouched',
    resolver: zodResolver(campaignSchema),
    defaultValues: { ...toStudioValues(null, 'hello@exyconn.com', 'INR'), ...values },
  });
  useEffect(() => {
    onForm?.(form);
  }, [form, onForm]);
  return <FormProvider {...form}>{children}</FormProvider>;
}
