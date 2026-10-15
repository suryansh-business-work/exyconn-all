import { Fragment } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { useT } from '@exyconn/i18n';
import { Button, Card, Flex, IconButton, Text } from '@exyconn/shell/components/ui';
import type { CrmPropertyInfo } from '../../schema';
import { MAX_CONDITIONS } from '../operators';
import { FilterConditionRow } from './FilterConditionRow';
import { emptyCondition, type FilterBuilderValues } from './filter-builder.types';

interface FilterGroupCardProps {
  index: number;
  properties: readonly CrmPropertyInfo[];
  onRemove: () => void;
}

/** One OR group: conditions that must all hold, joined by "and". */
export function FilterGroupCard({ index, properties, onRemove }: Readonly<FilterGroupCardProps>) {
  const t = useT();
  const { control } = useFormContext<FilterBuilderValues>();
  const conditions = useFieldArray({ control, name: `groups.${index}.conditions` });
  const heading = t('Group {number}', { number: index + 1 });

  return (
    <Card variant="outlined" sx={{ p: 2 }}>
      <Flex direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Text size="label" component="h3">
          {heading}
        </Text>
        <IconButton
          size="small"
          onClick={onRemove}
          aria-label={t('Remove group {number}', { number: index + 1 })}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Flex>
      <Flex direction="column" spacing={1}>
        {conditions.fields.map((condition, position) => (
          <Fragment key={condition.id}>
            {position > 0 && (
              <Text size="caption" color="text.secondary" weight="semibold">
                {t('and')}
              </Text>
            )}
            <FilterConditionRow
              path={`groups.${index}.conditions.${position}`}
              properties={properties}
              onRemove={() => conditions.remove(position)}
            />
          </Fragment>
        ))}
      </Flex>
      <Button
        size="small"
        startIcon={<AddIcon />}
        onClick={() => conditions.append(emptyCondition())}
        disabled={conditions.fields.length >= MAX_CONDITIONS}
        sx={{ mt: 1 }}
      >
        {t('Add filter')}
      </Button>
    </Card>
  );
}
