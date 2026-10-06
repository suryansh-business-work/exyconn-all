import { useT } from '@exyconn/i18n';
import { FormControlLabel, Switch, Text, TextField } from '@exyconn/shell/components/ui';
import type { PropNode } from './props-tree';
import { PropArrayList } from './PropArrayList';
import { PropObjectGroup } from './PropObjectGroup';
import { PropStringField } from './PropStringField';

export interface PropFieldProps {
  /** The prop's own key (an array item inherits its list's), which picks the editor. */
  name: string;
  label: string;
  node: PropNode;
  siteId: string;
  onChange: (node: PropNode) => void;
}

/** One prop, edited by the kind of value it holds; lists and groups recurse into this. */
export function PropField({ name, label, node, siteId, onChange }: Readonly<PropFieldProps>) {
  const t = useT();
  switch (node.kind) {
    case 'string':
      return (
        <PropStringField
          name={name}
          label={label}
          value={node.value}
          siteId={siteId}
          onChange={(value) => onChange({ ...node, value })}
        />
      );
    case 'number':
      return (
        <TextField
          type="number"
          label={label}
          value={node.value}
          fullWidth
          onChange={(event) => {
            const value = Number(event.target.value);
            if (!Number.isNaN(value)) onChange({ ...node, value });
          }}
        />
      );
    case 'boolean':
      return (
        <FormControlLabel
          label={label}
          control={
            <Switch
              checked={node.value}
              onChange={(_event, value) => onChange({ ...node, value })}
            />
          }
        />
      );
    case 'array':
      return (
        <PropArrayList
          name={name}
          label={label}
          node={node}
          siteId={siteId}
          onChange={onChange}
          Field={PropField}
        />
      );
    case 'object':
      return (
        <PropObjectGroup
          label={label}
          node={node}
          siteId={siteId}
          onChange={onChange}
          Field={PropField}
        />
      );
    default:
      return (
        <Text size="sm" color="text.secondary">
          {t('{label}: empty (edit it in the JSON view)', { label })}
        </Text>
      );
  }
}
