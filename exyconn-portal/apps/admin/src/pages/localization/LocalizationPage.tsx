import { useState } from 'react';
import { Box, Chip, Flex, MenuItem, TextField, Text } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { glass } from '@exyconn/shell/components/glass/glass';
import { useLanguageOptions } from '@exyconn/shell/components/localization';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  TranslationsDocument,
  useTranslationsQuery,
  type TranslationsQuery,
} from '@exyconn/shell/graphql/generated';
import { TranslationEditor } from './TranslationEditor';

type Row = TranslationsQuery['translations']['rows'][number];

/** How many rows one page of the review screen shows. */
const PAGE_SIZE = 50;

/**
 * Admin › Localization — what the portal has been translated into, and by what.
 *
 * The machine fills this table in on its own as people browse; this screen exists so a
 * human can disagree with it. A correction saved here is marked as a person's and is never
 * machine-written again.
 */
export function LocalizationPage() {
  const languages = useLanguageOptions(false);
  const { settings } = useSettings();
  const [locale, setLocale] = useState('');
  const [search, setSearch] = useState('');

  // Nothing is stored for the default language — there the source string is the text — so
  // the screen opens on the first language that is not it.
  const chosen =
    locale || languages.find((option) => option.value !== settings.defaultLocale)?.value || '';

  const { data, loading, refetch } = useTranslationsQuery({
    variables: { locale: chosen, search, limit: PAGE_SIZE },
    skip: chosen === '',
    fetchPolicy: 'cache-and-network',
  });

  const rows = data?.translations.rows ?? [];
  const total = data?.translations.total ?? 0;

  const columns: Column<Row>[] = [
    { key: 'source', label: 'English' },
    {
      key: 'text',
      label: 'Translation',
      render: (row) => (
        <TranslationEditor
          locale={row.locale}
          source={row.source}
          text={row.text}
          onSaved={() => {
            refetch().catch(() => undefined);
          }}
        />
      ),
    },
    {
      key: 'kind',
      label: 'By',
      render: (row) => (
        <Chip
          size="small"
          label={row.kind === 'HUMAN' ? 'Person' : row.model || 'Machine'}
          color={row.kind === 'HUMAN' ? 'success' : 'default'}
        />
      ),
    },
  ];

  const emptyMessage =
    'Nothing translated into this language yet. It fills in as people browse the portal.';

  return (
    <Box>
      <PageHeader
        title="Localization"
        subtitle="What the portal says in each language, and where each translation came from"
      />
      <Flex direction="row" gap={1.5} sx={{ mb: 1.5 }} flexWrap="wrap">
        <TextField
          select
          size="small"
          label="Language"
          value={chosen}
          onChange={(event) => setLocale(event.target.value)}
          sx={{ minWidth: 220 }}
        >
          {languages.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          label="Search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="English text or its translation"
          sx={{ minWidth: 260 }}
        />
        <Flex direction="row" alignItems="center">
          <Text size="sm" color="text.secondary">
            {total} translated
          </Text>
        </Flex>
      </Flex>
      <Box sx={[glass, { p: { xs: 1, md: 1.5 } }]}>
        <DataTable
          columns={columns}
          rows={rows}
          emptyMessage={emptyMessage}
          loading={loading}
          onRefresh={refetch}
        />
      </Box>
    </Box>
  );
}

/** Re-exported so a saved correction can refetch the list it came from. */
export { TranslationsDocument };
