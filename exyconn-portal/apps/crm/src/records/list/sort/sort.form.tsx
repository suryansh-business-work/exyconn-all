import { FormProvider, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import AddIcon from '@mui/icons-material/Add';
import { useT } from '@exyconn/i18n';
import type { SelectOption } from '@exyconn/shell/components/form/rhf';
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  Flex,
  Text,
} from '@exyconn/shell/components/ui';
import type { CrmSortInput } from '@exyconn/shell/graphql/generated';
import { MAX_SORTS } from '../../filters/operators';
import { SortLevelRow } from './SortLevelRow';
import { emptySortLevel, sortSchema, toSortFormValues, type SortFormValues } from './sort.types';

interface SortFormProps {
  /** The properties a list can be sorted by, already labelled. */
  options: SelectOption[];
  sorts: readonly CrmSortInput[];
  onApply: (sorts: CrmSortInput[]) => void;
  onCancel: () => void;
}

/** Up to three sort levels (React Hook Form + Zod); none means newest first. */
export function SortForm({ options, sorts, onApply, onCancel }: Readonly<SortFormProps>) {
  const t = useT();
  const methods = useForm<SortFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(sortSchema),
    defaultValues: toSortFormValues(sorts),
  });
  const levels = useFieldArray({ control: methods.control, name: 'levels' });
  const submit = methods.handleSubmit((values) => onApply(values.levels));

  return (
    <FormProvider {...methods}>
      <Box component="form" noValidate onSubmit={submit} aria-label={t('Sort')}>
        <DialogContent dividers>
          <Flex direction="column" spacing={1.5}>
            {levels.fields.length === 0 && (
              <Text size="sm" color="text.secondary">
                {t('Newest records first.')}
              </Text>
            )}
            {levels.fields.map((level, index) => (
              <SortLevelRow
                key={level.id}
                index={index}
                options={options}
                onRemove={() => levels.remove(index)}
              />
            ))}
            <Box>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() => levels.append(emptySortLevel())}
                disabled={levels.fields.length >= MAX_SORTS}
              >
                {t('Add sort level')}
              </Button>
            </Box>
          </Flex>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => levels.replace([])} sx={{ mr: 'auto' }}>
            {t('Clear sort')}
          </Button>
          <Button onClick={onCancel}>{t('Cancel')}</Button>
          <Button type="submit" variant="contained">
            {t('Apply')}
          </Button>
        </DialogActions>
      </Box>
    </FormProvider>
  );
}
