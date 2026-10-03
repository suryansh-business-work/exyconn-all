import { LIMITS, NODE_SCHEMAS } from '@exyconn/wa-flow';
import { ArrayEditor } from '../../fields/ArrayEditor';
import { CountedField } from '../../fields/CountedField';
import { MessageFrameFields } from '../../fields/MessageFrameFields';
import { NodeFormFrame } from '../../fields/NodeFormFrame';
import { TemplateHint } from '../../fields/TemplateHint';
import { nextId } from '../../fields/next-id';
import { DynamicRowsFields } from './DynamicRowsFields';
import { ListSectionItem } from './ListSectionItem';
import type { ListNodeFormProps } from './list.types';

const SCHEMA = NODE_SCHEMAS.list.shape.data;

function newSection(items: readonly Record<string, unknown>[]) {
  const id = nextId('section', items);
  return { id, title: '', rows: [{ id: `${id}-row-1`, title: '' }] };
}

/** Inspector form for a List node: a menu sheet of sections and rows, static or generated. */
export function ListNodeForm({ node, onApply }: Readonly<ListNodeFormProps>) {
  return (
    <NodeFormFrame schema={SCHEMA} data={node.data} onApply={onApply}>
      <MessageFrameFields />
      <CountedField
        name="button"
        label="Sheet button"
        max={LIMITS.buttonTitle}
        hint="Opens the list, e.g. “View options”"
      />
      <ArrayEditor
        name="sections"
        title="Sections"
        itemLabel="Section"
        Item={ListSectionItem}
        newItem={newSection}
        max={LIMITS.listSections}
      />
      <DynamicRowsFields />
      <TemplateHint />
    </NodeFormFrame>
  );
}
