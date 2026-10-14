import { LIMITS, NODE_SCHEMAS } from '@exyconn/wa-flow';
import { ArrayEditor } from '../../fields/ArrayEditor';
import { CountedField } from '../../fields/CountedField';
import { KeySelect } from '../../fields/KeySelect';
import { NodeFormFrame } from '../../fields/NodeFormFrame';
import { NumberField } from '../../fields/NumberField';
import { TemplateHint } from '../../fields/TemplateHint';
import { DocSectionItem } from './DocSectionItem';
import { docSectionStarter } from './doc-section-starter';
import type { DocumentNodeFormProps } from './document.types';

const SCHEMA = NODE_SCHEMAS.document.shape.data;

/** Schema limits (schema.ts `documentSchema`). */
const MAX = { fileName: 120, title: 120, subtitle: 200, footer: 300 } as const;
const FILE_TYPES = ['PDF', 'XLSX', 'DOCX'] as const;

const newSection = () => docSectionStarter('fields');

/** Inspector form for a Document node: a file bubble that opens a preview. */
export function DocumentNodeForm({ node, onApply }: Readonly<DocumentNodeFormProps>) {
  return (
    <NodeFormFrame schema={SCHEMA} data={node.data} onApply={onApply}>
      <CountedField name="document.fileName" label="File name" max={MAX.fileName} />
      <KeySelect name="document.fileType" label="File type" keys={FILE_TYPES} />
      <NumberField name="document.pages" label="Pages" />
      <NumberField name="document.sizeKb" label="Size (KB)" />
      <CountedField name="document.preview.title" label="Preview title" max={MAX.title} />
      <CountedField name="document.preview.subtitle" label="Preview subtitle" max={MAX.subtitle} />
      <ArrayEditor
        name="document.preview.sections"
        title="Preview sections"
        itemLabel="Section"
        Item={DocSectionItem}
        newItem={newSection}
      />
      <CountedField
        name="document.preview.footer"
        label="Preview footer"
        max={MAX.footer}
        multiline
      />
      <CountedField name="caption" label="Caption" max={LIMITS.text} multiline />
      <TemplateHint />
    </NodeFormFrame>
  );
}
