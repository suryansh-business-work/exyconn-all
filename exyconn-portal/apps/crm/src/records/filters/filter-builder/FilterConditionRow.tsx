import { get, useFormContext, useFormState, useWatch } from 'react-hook-form';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { useT } from '@exyconn/i18n';
import { Box, Flex, FormHelperText, IconButton } from '@exyconn/shell/components/ui';
import type { CrmPropertyInfo } from '../../schema';
import { ConditionValueEditor } from './fields/ConditionValueEditor';
import { OperatorSelect } from './fields/OperatorSelect';
import { PropertyPicker } from './fields/PropertyPicker';
import type { ConditionPath, FilterBuilderValues } from './filter-builder.types';

interface FilterConditionRowProps {
  path: ConditionPath;
  properties: readonly CrmPropertyInfo[];
  onRemove: () => void;
}

/** One "property, operator, value" line of a filter group, and the button that removes it. */
export function FilterConditionRow({
  path,
  properties,
  onRemove,
}: Readonly<FilterConditionRowProps>) {
  const t = useT();
  const { control } = useFormContext<FilterBuilderValues>();
  const key = useWatch({ control, name: `${path}.property` });
  const op = useWatch({ control, name: `${path}.op` });
  const { errors } = useFormState({ control, name: `${path}.values` });
  const valuesError = (get(errors, `${path}.values`) as { message?: string } | undefined)?.message;
  const property = properties.find((candidate) => candidate.key === key);

  return (
    <Flex direction="row" spacing={1} alignItems="flex-start">
      <Flex direction="column" spacing={1} sx={{ flex: 1, minWidth: 0 }}>
        <PropertyPicker path={path} properties={properties} />
        {property && <OperatorSelect path={path} ops={property.ops} />}
        {property && op !== '' && (
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <ConditionValueEditor path={path} property={property} op={op} />
            {valuesError && (
              <FormHelperText error role="alert">
                {t(valuesError)}
              </FormHelperText>
            )}
          </Box>
        )}
      </Flex>
      <IconButton onClick={onRemove} aria-label={t('Remove filter')} size="small">
        <DeleteOutlineIcon fontSize="small" />
      </IconButton>
    </Flex>
  );
}
