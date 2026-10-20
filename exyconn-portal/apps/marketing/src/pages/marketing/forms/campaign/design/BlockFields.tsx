import { useT } from '@exyconn/i18n';
import { Flex, MenuItem, TextField } from '@exyconn/shell/components/ui';
import { CaretTextField } from './CaretTextField';
import type { Align, Block } from './blocks';
import type { StudioOptions } from '../studio/useStudioOptions';

interface BlockFieldsProps {
  block: Block;
  onChange: (block: Block) => void;
  variables: StudioOptions['variables'];
}

type Patch = (changes: Partial<Block>) => void;

const ALIGNS: readonly Align[] = ['left', 'center', 'right'];

/** A colour as a native picker, which gives keyboard and screen-reader support for free. */
function ColorField({
  label,
  value,
  onChange,
}: Readonly<{ label: string; value: string; onChange: (value: string) => void }>) {
  const t = useT();
  return (
    <TextField
      type="color"
      label={t(label)}
      value={value || '#ffffff'}
      onChange={(event) => onChange(event.target.value)}
      sx={{ minWidth: 120 }}
    />
  );
}

function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max = 2000,
}: Readonly<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}>) {
  const t = useT();
  return (
    <TextField
      type="number"
      label={t(label)}
      value={value}
      onChange={(event) => onChange(Math.min(max, Math.max(min, Number(event.target.value) || 0)))}
      slotProps={{ htmlInput: { min, max } }}
      sx={{ maxWidth: 160 }}
    />
  );
}

function AlignField({
  value,
  onChange,
}: Readonly<{ value: Align; onChange: (value: Align) => void }>) {
  const t = useT();
  return (
    <TextField
      select
      label={t('Alignment')}
      value={value}
      onChange={(event) => onChange(event.target.value as Align)}
      sx={{ maxWidth: 160 }}
    >
      {ALIGNS.map((align) => (
        <MenuItem key={align} value={align}>
          {t(align)}
        </MenuItem>
      ))}
    </TextField>
  );
}

/** The fields particular to the block's type. */
function TypeFields({
  block,
  patch,
  variables,
}: Readonly<{ block: Block; patch: Patch; variables: BlockFieldsProps['variables'] }>) {
  switch (block.type) {
    case 'header':
      return (
        <>
          <CaretTextField
            label="Logo image address (https)"
            value={block.logoUrl}
            onChange={(logoUrl) => patch({ logoUrl })}
          />
          <CaretTextField
            label="Heading"
            value={block.title}
            onChange={(title) => patch({ title })}
            variables={variables}
          />
          <ColorField
            label="Heading colour"
            value={block.color}
            onChange={(color) => patch({ color })}
          />
          <AlignField value={block.align} onChange={(align) => patch({ align })} />
        </>
      );
    case 'text':
      return (
        <>
          <CaretTextField
            label="Text"
            multiline
            value={block.content}
            onChange={(content) => patch({ content })}
            variables={variables}
          />
          <NumberField
            label="Font size (px)"
            value={block.fontSize}
            min={10}
            max={40}
            onChange={(fontSize) => patch({ fontSize })}
          />
          <ColorField
            label="Text colour"
            value={block.color}
            onChange={(color) => patch({ color })}
          />
          <AlignField value={block.align} onChange={(align) => patch({ align })} />
        </>
      );
    case 'image':
      return (
        <>
          <CaretTextField
            label="Image address (https)"
            value={block.src}
            onChange={(src) => patch({ src })}
          />
          <CaretTextField
            label="Alternative text"
            helperText="Describes the image for screen readers and blocked images."
            value={block.alt}
            onChange={(alt) => patch({ alt })}
          />
          <CaretTextField
            label="Link (optional)"
            value={block.href}
            onChange={(href) => patch({ href })}
          />
          <NumberField
            label="Width (px)"
            value={block.width}
            min={50}
            max={600}
            onChange={(width) => patch({ width })}
          />
        </>
      );
    case 'button':
      return (
        <>
          <CaretTextField
            label="Button text"
            value={block.label}
            onChange={(label) => patch({ label })}
            variables={variables}
          />
          <CaretTextField
            label="Link"
            helperText="A web address, or a link variable."
            value={block.href}
            onChange={(href) => patch({ href })}
            variables={variables}
          />
          <ColorField
            label="Button colour"
            value={block.buttonColor}
            onChange={(buttonColor) => patch({ buttonColor })}
          />
          <ColorField
            label="Text colour"
            value={block.color}
            onChange={(color) => patch({ color })}
          />
          <AlignField value={block.align} onChange={(align) => patch({ align })} />
        </>
      );
    case 'columns':
      return (
        <>
          <CaretTextField
            label="Left column"
            multiline
            value={block.left}
            onChange={(left) => patch({ left })}
            variables={variables}
          />
          <CaretTextField
            label="Right column"
            multiline
            value={block.right}
            onChange={(right) => patch({ right })}
            variables={variables}
          />
          <ColorField
            label="Text colour"
            value={block.color}
            onChange={(color) => patch({ color })}
          />
        </>
      );
    case 'divider':
      return (
        <ColorField
          label="Line colour"
          value={block.color}
          onChange={(color) => patch({ color })}
        />
      );
    case 'spacer':
      return (
        <NumberField
          label="Height (px)"
          value={block.height}
          max={200}
          onChange={(height) => patch({ height })}
        />
      );
    default:
      return (
        <>
          <CaretTextField
            label="Footer text"
            multiline
            value={block.text}
            onChange={(text) => patch({ text })}
            variables={variables}
          />
          <ColorField
            label="Text colour"
            value={block.color}
            onChange={(color) => patch({ color })}
          />
        </>
      );
  }
}

/** Editing one block: its own fields, then background and spacing every block has. */
export function BlockFields({ block, onChange, variables }: Readonly<BlockFieldsProps>) {
  const patch: Patch = (changes) => onChange({ ...block, ...changes } as Block);
  return (
    <Flex direction="column" spacing={2}>
      <TypeFields block={block} patch={patch} variables={variables} />
      <Flex direction="row" gap={2} flexWrap="wrap">
        <ColorField
          label="Background"
          value={block.background}
          onChange={(background) => patch({ background })}
        />
        <NumberField
          label="Padding (px)"
          value={block.padding}
          max={80}
          onChange={(padding) => patch({ padding })}
        />
      </Flex>
    </Flex>
  );
}
