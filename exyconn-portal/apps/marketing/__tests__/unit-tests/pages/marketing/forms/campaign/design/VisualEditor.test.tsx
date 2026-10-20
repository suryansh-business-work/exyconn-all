import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VisualEditor } from '../../../../../../../src/pages/marketing/forms/campaign/design/VisualEditor';
import {
  DEFAULT_SETTINGS,
  newBlock,
  type Block,
  type Design,
} from '../../../../../../../src/pages/marketing/forms/campaign/design/blocks';
import { renderWithProviders } from '../../../../../test-utils';
import { VARIABLES } from '../studio.fixtures';

/** The editor holding its own design, as the Design step does through the form. */
function Editor({
  initial,
  onChange,
}: Readonly<{ initial: Design; onChange: (design: Design) => void }>) {
  const [design, setDesign] = useState(initial);
  return (
    <VisualEditor
      design={design}
      variables={VARIABLES}
      onChange={(next) => {
        setDesign(next);
        onChange(next);
      }}
    />
  );
}

function renderEditor(blocks: Block[]) {
  const onChange = vi.fn();
  renderWithProviders(
    <Editor initial={{ settings: { ...DEFAULT_SETTINGS }, blocks }} onChange={onChange} />,
  );
  const last = () => onChange.mock.lastCall?.[0] as Design;
  return { onChange, last };
}

const listed = () =>
  within(screen.getByRole('list', { name: 'Email blocks' }))
    .getAllByRole('button')
    .filter((button) => !button.getAttribute('aria-label'))
    .map((button) => button.textContent);

const header = { ...newBlock('header'), title: 'Our team' } as Block;
const text = { ...newBlock('text'), content: 'x'.repeat(80) } as Block;
const button = { ...newBlock('button'), label: 'Book now' } as Block;
const image = { ...newBlock('image'), alt: '', src: 'https://x/a.png' } as Block;
const divider = newBlock('divider');

describe('VisualEditor', () => {
  it('lists the blocks with a one-line summary each', () => {
    renderEditor([header, text, button, image, divider]);
    expect(listed()).toEqual([
      'HeaderOur team',
      `Text${'x'.repeat(60)}`,
      'ButtonBook now',
      'Imagehttps://x/a.png',
      'Divider',
    ]);
  });

  it('summarises an image by its alternative text when it has one', () => {
    renderEditor([{ ...image, alt: 'A cup' } as Block]);
    expect(listed()).toEqual(['ImageA cup']);
  });

  it('edits the first block until another is selected', async () => {
    renderEditor([header, button]);
    expect(screen.getByLabelText('Heading')).toHaveValue('Our team');
    await userEvent.click(screen.getByRole('button', { name: /^Button\s*Book now/ }));
    expect(screen.getByLabelText('Button text')).toHaveValue('Book now');
    expect(screen.queryByLabelText('Heading')).not.toBeInTheDocument();
  });

  it('saves edits to the selected block only', () => {
    const { last } = renderEditor([header, button]);
    fireEvent.change(screen.getByLabelText('Heading'), { target: { value: 'Welcome' } });
    expect(last().blocks).toEqual([{ ...header, title: 'Welcome' }, button]);
  });

  it('moves blocks up and down, but not past either end', async () => {
    const { last } = renderEditor([header, button, divider]);
    expect(screen.getByRole('button', { name: 'Move Header up' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move Divider down' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Move Header down' }));
    expect(last().blocks.map((block) => block.type)).toEqual(['button', 'header', 'divider']);
    await userEvent.click(screen.getByRole('button', { name: 'Move Divider up' }));
    expect(last().blocks.map((block) => block.type)).toEqual(['button', 'divider', 'header']);
  });

  it('removes a block, and asks for a selection once the selected one is gone', async () => {
    const { last } = renderEditor([header, button]);
    await userEvent.click(screen.getByRole('button', { name: 'Remove Header' }));
    expect(last().blocks).toEqual([button]);
    expect(screen.getByText('Select a block to edit it.')).toBeInTheDocument();
  });

  it('adds a block after the selected one and selects it', async () => {
    const { last } = renderEditor([header, button]);
    await userEvent.click(screen.getByRole('button', { name: 'Add block' }));
    const menu = screen.getByRole('menu');
    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map((item) => item.textContent),
    ).toEqual([
      'Header',
      'Text',
      'Image',
      'Button',
      'Two columns',
      'Divider',
      'Spacer',
      'Footer with unsubscribe',
    ]);
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Spacer' }));
    expect(last().blocks.map((block) => block.type)).toEqual(['header', 'spacer', 'button']);
    expect(screen.getByLabelText('Height (px)')).toHaveValue(24);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('adds a block at the end when nothing is selected', async () => {
    const { last } = renderEditor([]);
    expect(screen.getByText('Select a block to edit it.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Add block' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Two columns' }));
    expect(last().blocks.map((block) => block.type)).toEqual(['columns']);
    expect(screen.getByLabelText('Left column')).toHaveValue('Left column');
  });

  it('closes the add menu without adding anything', async () => {
    const { onChange } = renderEditor([header]);
    await userEvent.click(screen.getByRole('button', { name: 'Add block' }));
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('edits the page-wide settings', () => {
    const { last } = renderEditor([header]);
    const edits: Array<[string, string, Partial<Design['settings']>]> = [
      ['Page background', '#000000', { pageBackground: '#000000' }],
      ['Content background', '#111111', { contentBackground: '#111111' }],
      ['Link colour', '#222222', { linkColor: '#222222' }],
      ['Font family', 'Georgia, serif', { fontFamily: 'Georgia, serif' }],
    ];
    let settings = { ...DEFAULT_SETTINGS };
    for (const [label, value, expected] of edits) {
      fireEvent.change(screen.getByLabelText(label), { target: { value } });
      settings = { ...settings, ...expected };
      expect(last().settings).toEqual(settings);
    }
    expect(last().blocks).toEqual([header]);
  });
});
