import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BlockFields } from '../../../../../../../src/pages/marketing/forms/campaign/design/BlockFields';
import {
  newBlock,
  type Block,
  type BlockType,
} from '../../../../../../../src/pages/marketing/forms/campaign/design/blocks';
import { renderWithProviders } from '../../../../../test-utils';
import { VARIABLES } from '../studio.fixtures';

function renderFields(block: Block) {
  const onChange = vi.fn();
  renderWithProviders(<BlockFields block={block} onChange={onChange} variables={VARIABLES} />);
  return onChange;
}

const change = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

/** The labels of every field the block shows, in order. */
const fieldLabels = () =>
  Array.from(document.querySelectorAll('label'), (label) => label.textContent?.replace(' *', ''));

const PICKERS = (count: number) => Array.from({ length: count }, () => 'Insert variable');

describe('BlockFields', () => {
  it.each<[BlockType, string[]]>([
    ['header', ['Logo image address (https)', 'Heading', ...PICKERS(1), 'Heading colour']],
    ['text', ['Text', ...PICKERS(1), 'Font size (px)', 'Text colour']],
    ['image', ['Image address (https)', 'Alternative text', 'Link (optional)', 'Width (px)']],
    [
      'button',
      ['Button text', ...PICKERS(1), 'Link', ...PICKERS(1), 'Button colour', 'Text colour'],
    ],
    ['columns', ['Left column', ...PICKERS(1), 'Right column', ...PICKERS(1), 'Text colour']],
    ['divider', ['Line colour']],
    ['spacer', ['Height (px)']],
    ['footer', ['Footer text', ...PICKERS(1), 'Text colour']],
  ])('shows the %s block’s own fields, then background and padding', (type, labels) => {
    renderFields(newBlock(type));
    expect(fieldLabels().filter((label) => label !== 'Alignment')).toEqual([
      ...labels,
      'Background',
      'Padding (px)',
    ]);
    const aligned = new Set<BlockType>(['header', 'text', 'button']);
    expect(screen.queryAllByRole('combobox', { name: /Alignment/ })).toHaveLength(
      aligned.has(type) ? 1 : 0,
    );
  });

  it('edits a header block', () => {
    const block = newBlock('header');
    const onChange = renderFields(block);
    change('Logo image address (https)', 'https://cdn/logo.png');
    expect(onChange).toHaveBeenLastCalledWith({ ...block, logoUrl: 'https://cdn/logo.png' });
    change('Heading', 'Welcome');
    expect(onChange).toHaveBeenLastCalledWith({ ...block, title: 'Welcome' });
    change('Heading colour', '#ff0000');
    expect(onChange).toHaveBeenLastCalledWith({ ...block, color: '#ff0000' });
  });

  it('aligns a block from the list of alignments', async () => {
    const block = newBlock('text');
    const onChange = renderFields(block);
    await userEvent.click(screen.getByRole('combobox', { name: /Alignment/ }));
    const options = within(screen.getByRole('listbox')).getAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual(['left', 'center', 'right']);
    await userEvent.click(screen.getByRole('option', { name: 'right' }));
    expect(onChange).toHaveBeenLastCalledWith({ ...block, align: 'right' });
  });

  it('keeps numbers inside their limits and reads junk as zero', () => {
    const block = newBlock('text');
    const onChange = renderFields(block);
    const size = screen.getByLabelText('Font size (px)');
    expect(size).toHaveAttribute('min', '10');
    expect(size).toHaveAttribute('max', '40');
    change('Font size (px)', '99');
    expect(onChange).toHaveBeenLastCalledWith({ ...block, fontSize: 40 });
    change('Font size (px)', '2');
    expect(onChange).toHaveBeenLastCalledWith({ ...block, fontSize: 10 });
    change('Font size (px)', '18');
    expect(onChange).toHaveBeenLastCalledWith({ ...block, fontSize: 18 });
    change('Padding (px)', '500');
    expect(onChange).toHaveBeenLastCalledWith({ ...block, padding: 80 });
    change('Padding (px)', '');
    expect(onChange).toHaveBeenLastCalledWith({ ...block, padding: 0 });
  });

  it('edits text, its colour and the shared background', () => {
    const block = newBlock('text');
    const onChange = renderFields(block);
    change('Text', 'Hello');
    expect(onChange).toHaveBeenLastCalledWith({ ...block, content: 'Hello' });
    change('Text colour', '#000000');
    expect(onChange).toHaveBeenLastCalledWith({ ...block, color: '#000000' });
    expect(screen.getByLabelText('Background')).toHaveValue('#ffffff');
    change('Background', '#eeeeee');
    expect(onChange).toHaveBeenLastCalledWith({ ...block, background: '#eeeeee' });
  });

  it('edits an image block within its width limits', () => {
    const block = newBlock('image');
    const onChange = renderFields(block);
    expect(screen.getByText(/Describes the image for screen readers/)).toBeInTheDocument();
    change('Image address (https)', 'https://x/a.png');
    expect(onChange).toHaveBeenLastCalledWith({ ...block, src: 'https://x/a.png' });
    change('Alternative text', 'A cup');
    expect(onChange).toHaveBeenLastCalledWith({ ...block, alt: 'A cup' });
    change('Link (optional)', 'https://x');
    expect(onChange).toHaveBeenLastCalledWith({ ...block, href: 'https://x' });
    change('Width (px)', '10');
    expect(onChange).toHaveBeenLastCalledWith({ ...block, width: 50 });
    change('Width (px)', '900');
    expect(onChange).toHaveBeenLastCalledWith({ ...block, width: 600 });
  });

  it('edits a button block', () => {
    const block = newBlock('button');
    const onChange = renderFields(block);
    change('Button text', 'Book');
    expect(onChange).toHaveBeenLastCalledWith({ ...block, label: 'Book' });
    change('Link', 'https://book');
    expect(onChange).toHaveBeenLastCalledWith({ ...block, href: 'https://book' });
    change('Button colour', '#111111');
    expect(onChange).toHaveBeenLastCalledWith({ ...block, buttonColor: '#111111' });
    change('Text colour', '#222222');
    expect(onChange).toHaveBeenLastCalledWith({ ...block, color: '#222222' });
  });

  it('edits both columns and their colour', () => {
    const block = newBlock('columns');
    const onChange = renderFields(block);
    change('Left column', 'L');
    expect(onChange).toHaveBeenLastCalledWith({ ...block, left: 'L' });
    change('Right column', 'R');
    expect(onChange).toHaveBeenLastCalledWith({ ...block, right: 'R' });
    change('Text colour', '#333333');
    expect(onChange).toHaveBeenLastCalledWith({ ...block, color: '#333333' });
  });

  it('edits a divider, a spacer and a footer', () => {
    const divider = newBlock('divider');
    const onDivider = renderFields(divider);
    change('Line colour', '#444444');
    expect(onDivider).toHaveBeenLastCalledWith({ ...divider, color: '#444444' });
    document.body.innerHTML = '';

    const spacer = newBlock('spacer');
    const onSpacer = renderFields(spacer);
    change('Height (px)', '300');
    expect(onSpacer).toHaveBeenLastCalledWith({ ...spacer, height: 200 });
    document.body.innerHTML = '';

    const footer = newBlock('footer');
    const onFooter = renderFields(footer);
    change('Footer text', 'Bye');
    expect(onFooter).toHaveBeenLastCalledWith({ ...footer, text: 'Bye' });
    change('Text colour', '#555555');
    expect(onFooter).toHaveBeenLastCalledWith({ ...footer, color: '#555555' });
  });
});
