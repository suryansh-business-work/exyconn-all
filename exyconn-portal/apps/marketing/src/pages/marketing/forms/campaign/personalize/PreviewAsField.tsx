import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import { Autocomplete, TextField } from '@exyconn/shell/components/ui';
import { useDebouncedValue } from '@exyconn/shell/hooks/useDebouncedValue';
import {
  usePreviewRecordOptionsQuery,
  type PreviewRecordOptionsQuery,
} from '@exyconn/shell/graphql/generated';

export type PreviewRecord = PreviewRecordOptionsQuery['previewRecordOptions'][number];

interface PreviewAsFieldProps {
  value: PreviewRecord | null;
  onChange: (record: PreviewRecord | null) => void;
}

const SEARCH_DELAY_MS = 300;

/** Search the CRM for a contact or company to preview the email as; empty uses sample data. */
export function PreviewAsField({ value, onChange }: Readonly<PreviewAsFieldProps>) {
  const t = useT();
  const [input, setInput] = useState('');
  const search = useDebouncedValue(input.trim(), SEARCH_DELAY_MS);
  const { data, loading } = usePreviewRecordOptionsQuery({
    variables: { search },
    skip: search.length < 2,
  });
  return (
    <Autocomplete
      options={data?.previewRecordOptions ?? []}
      loading={loading}
      value={value}
      onChange={(_event, record) => onChange(record)}
      onInputChange={(_event, next) => setInput(next)}
      filterOptions={(options) => options}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      groupBy={(record) => t(record.kind === 'COMPANY' ? 'Companies' : 'Contacts')}
      getOptionLabel={(record) => (record.email ? `${record.name} · ${record.email}` : record.name)}
      noOptionsText={t(
        search.length < 2 ? 'Type at least two letters' : 'No matching contact or company',
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label={t('Preview as')}
          helperText={t(
            'Search a real contact or company. Leave empty to use sample data. Nothing is sent.',
          )}
        />
      )}
    />
  );
}
