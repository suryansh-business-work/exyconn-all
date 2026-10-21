import { Fragment, useMemo } from 'react';
import { FormProvider, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import AddIcon from '@mui/icons-material/Add';
import { useT } from '@exyconn/i18n';
import { Box, Button, Divider, Flex, Text } from '@exyconn/shell/components/ui';
import type { FilterGroup } from '../../list/recordQuery';
import type { CrmPropertyInfo } from '../../schema';
import { MAX_GROUPS } from '../operators';
import { FilterGroupCard } from './FilterGroupCard';
import {
  emptyGroup,
  filterBuilderSchema,
  fromBuilderValues,
  toBuilderValues,
  type FilterBuilderValues,
} from './filter-builder.types';

interface FilterBuilderFormProps {
  properties: readonly CrmPropertyInfo[];
  /** The filters the list has now. */
  groups: readonly FilterGroup[];
  onApply: (groups: FilterGroup[]) => void;
  onCancel: () => void;
}

/**
 * The filter builder: OR groups of AND conditions, validated (React Hook Form + Zod) against
 * each property's type and operators before anything is sent to the server.
 */
export function FilterBuilderForm({
  properties,
  groups,
  onApply,
  onCancel,
}: Readonly<FilterBuilderFormProps>) {
  const t = useT();
  const schema = useMemo(() => filterBuilderSchema(properties), [properties]);
  const methods = useForm<FilterBuilderValues>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: toBuilderValues(groups),
  });
  const list = useFieldArray({ control: methods.control, name: 'groups' });
  const submit = methods.handleSubmit((values) => onApply(fromBuilderValues(values)));
  const addLabel = list.fields.length === 0 ? 'Add filter' : 'Add filter group';

  return (
    <FormProvider {...methods}>
      <Box
        component="form"
        noValidate
        onSubmit={submit}
        aria-label={t('Filters')}
        sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
      >
        <Flex direction="column" spacing={1.5} sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
          {list.fields.length === 0 && (
            <Text size="sm" color="text.secondary">
              {t('No filters yet. Every record is shown.')}
            </Text>
          )}
          {list.fields.map((group, index) => (
            <Fragment key={group.id}>
              {index > 0 && (
                <Divider>
                  <Text size="caption" weight="semibold">
                    {t('OR')}
                  </Text>
                </Divider>
              )}
              <FilterGroupCard
                index={index}
                properties={properties}
                onRemove={() => list.remove(index)}
              />
            </Fragment>
          ))}
          <Box>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => list.append(emptyGroup())}
              disabled={list.fields.length >= MAX_GROUPS}
            >
              {t(addLabel)}
            </Button>
          </Box>
        </Flex>
        <Flex
          direction="row"
          spacing={1}
          justifyContent="flex-end"
          sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}
        >
          <Button onClick={() => list.replace([])} sx={{ mr: 'auto' }}>
            {t('Clear all')}
          </Button>
          <Button onClick={onCancel}>{t('Cancel')}</Button>
          <Button type="submit" variant="contained">
            {t('Apply')}
          </Button>
        </Flex>
      </Box>
    </FormProvider>
  );
}
