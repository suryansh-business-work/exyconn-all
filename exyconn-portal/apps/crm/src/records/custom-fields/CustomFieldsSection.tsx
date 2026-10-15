import { useT } from '@exyconn/i18n';
import { Box, Text } from '@exyconn/shell/components/ui';
import { CustomFieldInput } from './CustomFieldInput';
import type { CustomPropertyDef } from './custom-fields.schema';

interface CustomFieldsSectionProps {
  /** The record type's custom properties, in their order. */
  properties: readonly CustomPropertyDef[];
  /** Where the values live in the form; `custom` unless the form nests them elsewhere. */
  name?: string;
}

/**
 * The company's own properties of a record, inside an existing React Hook Form form: one input
 * per property under a "Custom properties" heading, two to a row from tablet width up. Renders
 * nothing when the record type has none. Pair with `customFieldsSchema` and `customDefaults`.
 */
export function CustomFieldsSection({
  properties,
  name = 'custom',
}: Readonly<CustomFieldsSectionProps>) {
  const t = useT();
  if (properties.length === 0) {
    return null;
  }
  return (
    <Box component="section" aria-label={t('Custom properties')}>
      <Text component="h3" size="label" weight="bold" sx={{ mb: 1.5 }}>
        {t('Custom properties')}
      </Text>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
        }}
      >
        {properties.map((property) => (
          <CustomFieldInput
            key={property.key}
            property={property}
            name={`${name}.${property.key}`}
          />
        ))}
      </Box>
    </Box>
  );
}
