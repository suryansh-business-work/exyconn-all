import { useWatch, useFormContext } from 'react-hook-form';
import { useT } from '@exyconn/i18n';
import { Box, Flex, Paper, Text } from '@exyconn/shell/components/ui';
import type { DesignSystemFormValues, TokenRow } from './cms-design-system.types';

const filled = (rows: readonly TokenRow[] | undefined) =>
  (rows ?? []).filter((row) => row.key.trim() !== '' && row.value.trim() !== '');

function Swatches({ title, rows }: Readonly<{ title: string; rows: TokenRow[] }>) {
  const t = useT();
  if (rows.length === 0) return null;
  return (
    <Box>
      <Text size="caption" color="text.secondary" component="div" sx={{ mb: 1 }}>
        {t(title)}
      </Text>
      <Flex gap={1} sx={{ flexWrap: 'wrap' }}>
        {rows.map((row) => (
          <Flex key={row.key} direction="column" alignItems="center" sx={{ width: 72 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 1,
                border: 1,
                borderColor: 'divider',
                background: row.value,
              }}
            />
            <Text size="caption" noWrap sx={{ maxWidth: 72 }} title={row.key}>
              {row.key}
            </Text>
          </Flex>
        ))}
      </Flex>
    </Box>
  );
}

function Shapes({ radii, shadows }: Readonly<{ radii: TokenRow[]; shadows: TokenRow[] }>) {
  const t = useT();
  if (radii.length === 0 && shadows.length === 0) return null;
  return (
    <Box>
      <Text size="caption" color="text.secondary" component="div" sx={{ mb: 1 }}>
        {t('Radii and shadows')}
      </Text>
      <Flex gap={1.5} sx={{ flexWrap: 'wrap' }}>
        {radii.map((row) => (
          <Box
            key={`r-${row.key}`}
            sx={{
              width: 56,
              height: 40,
              border: 2,
              borderColor: 'primary.main',
              borderRadius: row.value,
            }}
            title={row.key}
          />
        ))}
        {shadows.map((row) => (
          <Box
            key={`s-${row.key}`}
            sx={{ width: 56, height: 40, bgcolor: 'background.paper', boxShadow: row.value }}
            title={row.key}
          />
        ))}
      </Flex>
    </Box>
  );
}

/**
 * The palette and daylight roles as custom properties, so a swatch whose value is
 * var(--palette-gray-900) or var(--color-primary) shows the colour it resolves to.
 */
function colourVariables(palette: TokenRow[], light: TokenRow[]): Record<string, string> {
  return Object.fromEntries([
    ...palette.map((row) => [`--palette-${row.key}`, row.value]),
    ...light.map((row) => [`--color-${row.key}`, row.value]),
  ]);
}

/** Live swatches of the tokens being edited: colours, type, radii and shadows. */
export function DesignPreview() {
  const t = useT();
  const { control } = useFormContext<DesignSystemFormValues>();
  const values = useWatch({ control });
  const fonts = filled(values.fonts as TokenRow[]);
  const palette = filled(values.palette as TokenRow[]);
  const light = filled(values.colorsLight as TokenRow[]);

  return (
    <Paper
      variant="outlined"
      style={colourVariables(palette, light)}
      sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}
    >
      <Text weight="semibold">{t('Preview')}</Text>
      <Swatches title="Palette" rows={palette} />
      <Swatches title="Light colours" rows={light} />
      <Swatches title="Dark colours" rows={filled(values.colorsDark as TokenRow[])} />
      {fonts.map((row) => (
        <Text key={row.key} component="div" sx={{ fontFamily: row.value }}>
          {t('{name}: The quick brown fox jumps over the lazy dog', { name: row.key })}
        </Text>
      ))}
      <Shapes
        radii={filled(values.radii as TokenRow[])}
        shadows={filled(values.shadows as TokenRow[])}
      />
    </Paper>
  );
}
