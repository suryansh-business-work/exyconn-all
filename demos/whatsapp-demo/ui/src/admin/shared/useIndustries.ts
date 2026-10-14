import { useCallback, useMemo } from 'react';
import { useWhatsappDemosQuery } from '@exyconn/shell/graphql/generated';

export interface IndustryOption {
  key: string;
  industry: string;
}

export interface Industries {
  /** Every configured demo, in its catalogue order — the options of an industry filter. */
  options: IndustryOption[];
  /** The industry a demo key stands for; the key itself when the demo has since been removed. */
  industryName: (demoKey: string) => string;
}

/**
 * Demo keys as the industries people know them by. Events and stats carry only the key, so
 * the admin screens resolve it once here rather than each asking the server for names.
 */
export function useIndustries(): Industries {
  const { data } = useWhatsappDemosQuery();
  const options = useMemo(
    // A copy, sorted: the portal's ES2021 target has no toSorted().
    () =>
      [...(data?.whatsappDemos ?? [])]
        .sort((a, b) => a.order - b.order)
        .map((demo) => ({ key: demo.key, industry: demo.industry })),
    [data],
  );
  const names = useMemo(
    () => new Map(options.map((option) => [option.key, option.industry])),
    [options],
  );
  const industryName = useCallback((demoKey: string) => names.get(demoKey) ?? demoKey, [names]);
  return { options, industryName };
}
