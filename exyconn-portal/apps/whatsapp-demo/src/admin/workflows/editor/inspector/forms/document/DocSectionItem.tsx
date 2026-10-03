import { useFormContext, useWatch } from 'react-hook-form';
import type { ArrayItemProps } from '../../fields/ArrayEditor';
import { CountedField } from '../../fields/CountedField';
import { KindSwitch } from '../../fields/KindSwitch';
import { DocFieldsPart, DocTablePart, DocTextPart } from './DocSectionParts';
import { docSectionStarter, type DocSectionKind } from './doc-section-starter';

/** Schema limit (schema.ts `docSectionSchema.heading`). */
const HEADING_MAX = 80;

const KIND_LABELS: Readonly<Record<DocSectionKind, string>> = {
  fields: 'Label and value pairs',
  table: 'Table',
  text: 'Paragraph',
};

const switchKind = (kind: string, current: Record<string, unknown>) =>
  docSectionStarter(kind as DocSectionKind, current.heading as string | undefined);

/** One section of the document's preview. */
export function DocSectionItem({ name }: Readonly<ArrayItemProps>) {
  const { control } = useFormContext();
  const kind = useWatch({ control, name: `${name}.kind` }) as DocSectionKind;

  return (
    <>
      <KindSwitch name={name} label="Section type" kinds={KIND_LABELS} starter={switchKind} />
      <CountedField name={`${name}.heading`} label="Heading" max={HEADING_MAX} />
      {kind === 'fields' && <DocFieldsPart name={name} />}
      {kind === 'table' && <DocTablePart name={name} />}
      {kind === 'text' && <DocTextPart name={name} />}
    </>
  );
}
