import { Controller, useFormContext } from 'react-hook-form';
import { useT } from '@exyconn/i18n';
import {
  Flex,
  ListItemIcon,
  ListItemText,
  MenuItem,
  TextField,
} from '@exyconn/shell/components/ui';
import type { CrmPropertyType } from '@exyconn/shell/graphql/generated';
import {
  PROPERTY_TYPE_HINTS,
  PROPERTY_TYPE_ICONS,
  PROPERTY_TYPE_LABELS,
} from '../../property-types';
import type { CrmPropertyFormValues } from './crm-property.types';

/** Every type, in the order the labels list them. */
const TYPES = Object.keys(PROPERTY_TYPE_LABELS) as CrmPropertyType[];

/** The chosen type as the closed select shows it: its icon and name on one line. */
function ChosenType({ type }: Readonly<{ type: CrmPropertyType }>) {
  const t = useT();
  const Icon = PROPERTY_TYPE_ICONS[type];
  return (
    <Flex direction="row" spacing={1} alignItems="center">
      <Icon fontSize="small" color="action" />
      {t(PROPERTY_TYPE_LABELS[type])}
    </Flex>
  );
}

/** The type picker: each type with an icon and a line on what it is for. */
export function CrmPropertyTypeSelect() {
  const t = useT();
  const { control } = useFormContext<CrmPropertyFormValues>();
  return (
    <Controller
      name="type"
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          select
          fullWidth
          label={t('Type')}
          error={Boolean(fieldState.error)}
          helperText={t(fieldState.error?.message ?? PROPERTY_TYPE_HINTS[field.value])}
          slotProps={{
            select: { renderValue: (value) => <ChosenType type={value as CrmPropertyType} /> },
          }}
        >
          {TYPES.map((type) => {
            const Icon = PROPERTY_TYPE_ICONS[type];
            return (
              <MenuItem key={type} value={type}>
                <ListItemIcon>
                  <Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={t(PROPERTY_TYPE_LABELS[type])}
                  secondary={t(PROPERTY_TYPE_HINTS[type])}
                />
              </MenuItem>
            );
          })}
        </TextField>
      )}
    />
  );
}
