import { useEffect, type ReactNode } from 'react';
import { FormProvider, useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  campaignSchema,
  toStudioValues,
  type CampaignStudioValues,
} from '../../../../../../src/pages/marketing/forms/campaign/campaign.types';

interface StudioFormHarnessProps {
  children: ReactNode;
  values?: Partial<CampaignStudioValues>;
  /** Handed the form once, so a test can read or set values and trigger validation. */
  onForm?: (form: UseFormReturn<CampaignStudioValues>) => void;
}

/** The studio's form context around a step, as CampaignForm provides it. */
export function StudioFormHarness({ children, values, onForm }: Readonly<StudioFormHarnessProps>) {
  const form = useForm<CampaignStudioValues>({
    mode: 'onTouched',
    resolver: zodResolver(campaignSchema),
    defaultValues: { ...toStudioValues(null, 'hello@exyconn.com'), ...values },
  });
  useEffect(() => {
    onForm?.(form);
  }, [form, onForm]);
  return <FormProvider {...form}>{children}</FormProvider>;
}
