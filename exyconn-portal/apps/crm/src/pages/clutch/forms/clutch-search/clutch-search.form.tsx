import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { HTTP_URL } from '@exyconn/regex';
import { useT } from '@exyconn/i18n';
import { Alert } from '@exyconn/shell/components/ui';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import {
  RhfChipsInput,
  RhfSelect,
  RhfSwitch,
  RhfTextField,
} from '@exyconn/shell/components/form/rhf';
import { ClutchEngine } from '@exyconn/shell/graphql/generated';
import type { ClutchSearchFormValues } from './clutch-search.types';

const MAX_ITEMS = 200;

const schema = z
  .object({
    engine: z.enum(ClutchEngine),
    keyword: z.string().trim().max(200, 'Keep the search under 200 characters'),
    location: z.string().trim().max(120, 'Keep the place under 120 characters'),
    industry: z.string().trim().max(120, 'Keep the industry under 120 characters'),
    profileUrls: z
      .array(
        z.string().trim().regex(HTTP_URL, 'Paste full links, like https://clutch.co/profile/acme'),
      )
      .max(20, 'Up to 20 profile links at a time'),
    includeDetails: z.boolean(),
    includeReviews: z.boolean(),
    includePortfolio: z.boolean(),
    maxItems: z
      .string()
      .min(1, 'How many companies at most?')
      .refine(
        (v) => Number.isInteger(Number(v)) && Number(v) >= 1 && Number(v) <= MAX_ITEMS,
        'Between 1 and 200',
      ),
  })
  .refine((v) => v.keyword !== '' || v.profileUrls.length > 0, {
    path: ['keyword'],
    message: 'Type what to search for, or paste a Clutch profile link',
  }) satisfies z.ZodType<ClutchSearchFormValues>;

type Values = z.infer<typeof schema>;

export const CLUTCH_SEARCH_DEFAULTS: ClutchSearchFormValues = {
  engine: ClutchEngine.Mcp,
  keyword: '',
  location: '',
  industry: '',
  profileUrls: [],
  includeDetails: true,
  includeReviews: false,
  includePortfolio: false,
  maxItems: '20',
};

interface ClutchSearchFormProps {
  /** Whether an Apify token is stored: without one, only Clutch's own server is offered. */
  apifyReady: boolean;
  onSearch: (values: ClutchSearchFormValues) => Promise<void>;
  onCancel: () => void;
}

/**
 * React Hook Form + Zod form for one Clutch search: by keyword (company search) and/or profile
 * links (company details), with reviews and portfolio as opt-in extras, on Clutch's own server
 * (free) or Apify (every result page, portfolio included).
 */
export function ClutchSearchForm({
  apifyReady,
  onSearch,
  onCancel,
}: Readonly<ClutchSearchFormProps>) {
  const t = useT();
  const methods = useForm<Values>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: CLUTCH_SEARCH_DEFAULTS,
  });
  const engine = methods.watch('engine');

  // A token removed while the form was open sends the search back to Clutch's own server.
  useEffect(() => {
    if (!apifyReady && engine === ClutchEngine.Apify) {
      methods.setValue('engine', ClutchEngine.Mcp);
    }
  }, [apifyReady, engine, methods]);

  const engines = [
    { value: ClutchEngine.Mcp, label: 'Clutch MCP (free, top matches)' },
    ...(apifyReady ? [{ value: ClutchEngine.Apify, label: 'Apify (every page, portfolio)' }] : []),
  ];

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSearch}
      isEdit={false}
      onCancel={onCancel}
      submitLabel="Search Clutch"
    >
      <RhfSelect
        name="engine"
        label="Search with"
        options={engines}
        helperText="Clutch’s own server is free; Apify pages through every result and adds portfolios."
      />
      <RhfTextField
        name="keyword"
        label="Service or keyword"
        helperText="e.g. Web Development, mobile app development, SEO."
      />
      <RhfTextField
        name="location"
        label="Location"
        helperText="Optional. A city or country, e.g. Pune or United Kingdom."
      />
      <RhfTextField
        name="industry"
        label="Client industry"
        helperText="Optional. e.g. Healthcare, eCommerce."
      />
      <RhfChipsInput
        name="profileUrls"
        label="Clutch profile links"
        helperText="Optional. Paste https://clutch.co/profile/… links to read those companies in full."
      />
      <RhfTextField
        name="maxItems"
        label="Companies at most"
        type="number"
        helperText="1 to 200. Apify bills per company scraped."
      />
      <RhfSwitch name="includeDetails" label="Full company details" />
      <RhfSwitch name="includeReviews" label="Client reviews" />
      <RhfSwitch name="includePortfolio" label="Portfolio and case studies" />
      {engine === ClutchEngine.Mcp && methods.watch('includePortfolio') && (
        <Alert severity="info">
          {t('Portfolio items come with Apify; Clutch’s own server does not list them.')}
        </Alert>
      )}
    </EntityForm>
  );
}
