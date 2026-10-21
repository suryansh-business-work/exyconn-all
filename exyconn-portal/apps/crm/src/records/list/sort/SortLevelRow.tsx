import { Controller, useFormContext } from 'react-hook-form';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { useT } from '@exyconn/i18n';
import { RhfSelect, type SelectOption } from '@exyconn/shell/components/form/rhf';
import {
  Box,
  Flex,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
} from '@exyconn/shell/components/ui';
import { SortDir } from '@exyconn/shell/graphql/generated';
import type { SortFormValues } from './sort.types';

interface SortLevelRowProps {
  index: number;
  options: SelectOption[];
  onRemove: () => void;
}

/** One sort level: the property, ascending or descending, and a remove button. */
export function SortLevelRow({ index, options, onRemove }: Readonly<SortLevelRowProps>) {
  const t = useT();
  const { control } = useFormContext<SortFormValues>();
  const label = index === 0 ? 'Sort by' : 'Then by';
  return (
    <Flex direction="row" spacing={1} alignItems="flex-start">
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <RhfSelect
          name={`levels.${index}.property`}
          label={label}
          options={options}
          helperText="Records are ordered by this; later levels only order records that tie."
        />
      </Box>
      <Controller
        name={`levels.${index}.dir`}
        control={control}
        render={({ field }) => (
          <ToggleButtonGroup
            exclusive
            size="small"
            value={field.value}
            onChange={(_event, dir: SortDir | null) => {
              // A toggle group can be clicked off; a sort level always has a direction.
              if (dir) {
                field.onChange(dir);
              }
            }}
            aria-label={t('Direction')}
            sx={{ mt: 1 }}
          >
            <ToggleButton value={SortDir.Asc}>{t('Ascending')}</ToggleButton>
            <ToggleButton value={SortDir.Desc}>{t('Descending')}</ToggleButton>
          </ToggleButtonGroup>
        )}
      />
      <IconButton
        onClick={onRemove}
        aria-label={t('Remove sort level {number}', { number: index + 1 })}
        sx={{ mt: 1 }}
      >
        <DeleteOutlineIcon fontSize="small" />
      </IconButton>
    </Flex>
  );
}
