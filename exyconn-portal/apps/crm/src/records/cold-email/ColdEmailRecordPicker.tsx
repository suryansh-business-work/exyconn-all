import { useEffect, useState, type HTMLAttributes } from 'react';
import { useT } from '@exyconn/i18n';
import {
  Autocomplete,
  Box,
  Flex,
  Stack,
  Text,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@exyconn/shell/components/ui';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  useColdEmailRecordOptions,
  type ColdEmailObject,
  type ColdEmailRecordOption,
} from './useColdEmailRecordOptions';

interface ColdEmailRecordPickerProps {
  object: ColdEmailObject;
  onObjectChange: (object: ColdEmailObject) => void;
  value: ColdEmailRecordOption | null;
  onChange: (record: ColdEmailRecordOption | null) => void;
}

/** One match: the record's name, with its role and company (or domain) underneath. */
function RecordOption({
  optionProps,
  option,
}: Readonly<{ optionProps: HTMLAttributes<HTMLLIElement>; option: ColdEmailRecordOption }>) {
  return (
    <Box component="li" {...optionProps}>
      <Stack>
        <Text>{option.name}</Text>
        {option.detail && (
          <Text size="caption" color="text.secondary">
            {option.detail}
          </Text>
        )}
      </Stack>
    </Box>
  );
}

/** Who the cold email is for: a contact or a company, found by searching the CRM. */
export function ColdEmailRecordPicker({
  object,
  onObjectChange,
  value,
  onChange,
}: Readonly<ColdEmailRecordPickerProps>) {
  const t = useT();
  const [typed, setTyped] = useState('');
  const { options, loading, error } = useColdEmailRecordOptions(object, typed);

  useEffect(() => {
    if (error) {
      portalLogger.warn('crm: searching records for a cold email failed', error);
    }
  }, [error]);

  const helperText = error
    ? t('The records could not be loaded. Try again.')
    : t('Type a name to search your CRM');

  return (
    <Flex direction="column" spacing={2}>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={object}
        onChange={(_event, next: ColdEmailObject | null) => {
          // A toggle group can be clicked off; the picker always searches one kind of record.
          if (next) {
            onObjectChange(next);
          }
        }}
        aria-label={t('Draft it for')}
      >
        <ToggleButton value="CONTACT">{t('Contact')}</ToggleButton>
        <ToggleButton value="COMPANY">{t('Company')}</ToggleButton>
      </ToggleButtonGroup>
      <Autocomplete<ColdEmailRecordOption>
        options={options}
        value={value}
        filterOptions={(list) => list}
        getOptionLabel={(option) => option.name}
        isOptionEqualToValue={(option, selected) => option.id === selected.id}
        loading={loading}
        loadingText={t('Searching…')}
        noOptionsText={t('No matches')}
        onInputChange={(_event, input) => setTyped(input)}
        onChange={(_event, record) => onChange(record)}
        renderOption={({ key: _key, ...optionProps }, option) => (
          <RecordOption key={option.id} optionProps={optionProps} option={option} />
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            label={object === 'CONTACT' ? t('Contact') : t('Company')}
            error={Boolean(error)}
            helperText={helperText}
          />
        )}
      />
    </Flex>
  );
}
