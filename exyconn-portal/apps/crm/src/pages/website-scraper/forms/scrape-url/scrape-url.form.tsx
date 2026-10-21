import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import { useT } from '@exyconn/i18n';
import { Box, Button } from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { scrapeUrlSchema, type ScrapeUrlValues } from './scrape-url.types';

interface ScrapeUrlFormProps {
  /** Prefilled (from `?url=`), never submitted on its own: every scrape costs money. */
  initialUrl: string;
  scraping: boolean;
  onScrape: (url: string) => void;
}

/** One web page to read through Firecrawl. */
export function ScrapeUrlForm({ initialUrl, scraping, onScrape }: Readonly<ScrapeUrlFormProps>) {
  const t = useT();
  const form = useForm<ScrapeUrlValues>({
    resolver: zodResolver(scrapeUrlSchema),
    defaultValues: { url: initialUrl },
    mode: 'onTouched',
  });
  return (
    <FormProvider {...form}>
      <Box
        component="form"
        noValidate
        sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flexWrap: 'wrap' }}
        onSubmit={form.handleSubmit((values) => onScrape(values.url))}
      >
        <RhfTextField
          name="url"
          label="Website"
          autoComplete="off"
          disabled={scraping}
          helperText="A domain or a page address. Firecrawl reads the page; each scrape uses Firecrawl credits."
          sx={{ flex: '1 1 320px' }}
        />
        <Button
          type="submit"
          variant="contained"
          startIcon={<TravelExploreIcon />}
          disabled={scraping}
          sx={{ mt: 1 }}
        >
          {scraping ? t('Scraping…') : t('Scrape')}
        </Button>
      </Box>
    </FormProvider>
  );
}
