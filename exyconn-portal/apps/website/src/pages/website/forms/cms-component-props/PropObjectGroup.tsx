import type { ComponentType } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Flex,
  Text,
} from '@exyconn/shell/components/ui';
import { labelOf, type PropNode } from './props-tree';
import type { PropFieldProps } from './PropField';

type ObjectNode = Extract<PropNode, { kind: 'object' }>;

interface PropObjectGroupProps {
  label: string;
  node: ObjectNode;
  siteId: string;
  onChange: (node: PropNode) => void;
  /** The field renderer, handed in so the two files do not import each other. */
  Field: ComponentType<PropFieldProps>;
  /** The top level is laid out flat; nested groups collapse. */
  flat?: boolean;
}

/** A group of props (a JSON object): one field per key, collapsible when nested. */
export function PropObjectGroup({
  label,
  node,
  siteId,
  onChange,
  Field,
  flat = false,
}: Readonly<PropObjectGroupProps>) {
  const fields = (
    <Flex direction="column" gap={2}>
      {node.entries.map((entry, index) => (
        <Field
          key={entry.node.id}
          name={entry.key}
          label={labelOf(entry.key)}
          node={entry.node}
          siteId={siteId}
          onChange={(child) => {
            const entries = [...node.entries];
            entries[index] = { key: entry.key, node: child };
            onChange({ ...node, entries });
          }}
        />
      ))}
    </Flex>
  );
  if (flat) return fields;
  return (
    <Accordion disableGutters variant="outlined" defaultExpanded={node.entries.length <= 4}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Text weight="semibold">{label}</Text>
      </AccordionSummary>
      <AccordionDetails>{fields}</AccordionDetails>
    </Accordion>
  );
}
