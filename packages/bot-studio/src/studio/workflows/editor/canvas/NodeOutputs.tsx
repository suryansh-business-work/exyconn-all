import { Handle, Position } from '@xyflow/react';
import { useT } from '@exyconn/i18n';
import type { OutputHandle } from '@exyconn/wa-flow';
import { Box, Text } from '@exyconn/shell/components/ui';

interface NodeOutputsProps {
  handles: readonly OutputHandle[];
  /** Handle fill, from the theme. */
  color: string;
}

/** Fixed handle ids are English words the editor shows; option ids show the option's title. */
const FIXED = new Set([
  'Next',
  'Valid answer',
  'Not understood',
  'Otherwise',
  'Now',
  'When due',
  'Any row',
]);

/** One labelled row per output, each with its own source handle on the right edge. */
export function NodeOutputs({ handles, color }: Readonly<NodeOutputsProps>) {
  const t = useT();
  return (
    <Box
      component="ul"
      sx={{ listStyle: 'none', m: 0, p: 0, borderTop: 1, borderColor: 'divider' }}
    >
      {handles.map((handle) => (
        <Box
          component="li"
          key={handle.id}
          sx={{ position: 'relative', px: 1.5, py: 0.5, textAlign: 'right' }}
        >
          <Text
            size="caption"
            color="text.secondary"
            noWrap
            component="span"
            sx={{ display: 'block' }}
          >
            {FIXED.has(handle.label) ? t(handle.label) : handle.label}
          </Text>
          <Handle
            type="source"
            position={Position.Right}
            id={handle.id}
            aria-label={t('Output {label}', { label: handle.label })}
            style={{ background: color, width: 10, height: 10 }}
          />
        </Box>
      ))}
    </Box>
  );
}
