import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PropField } from '../../../../../../src/pages/website/forms/cms-component-props/PropField';
import {
  fromTree,
  toTree,
  type PropNode,
} from '../../../../../../src/pages/website/forms/cms-component-props/props-tree';
import { renderWithProviders } from '../../../../test-utils';
import { press } from '../content-form-helpers';

vi.mock('@exyconn/rich-text', async () => ({
  RichTextEditor: (await import('./props-editor-stubs')).RichTextEditorStub,
}));

vi.mock('../../../../../../src/pages/cms/media', async () => {
  const stubs = await import('./props-editor-stubs');
  return { MediaUrlInput: stubs.MediaUrlInputStub, useMediaUpload: stubs.useMediaUploadStub };
});

/** Holds one prop's tree the way the form's Controller does, and prints its JSON. */
function Harness({ name, initial }: Readonly<{ name: string; initial: unknown }>) {
  const [node, setNode] = useState<PropNode>(() => toTree(initial));
  return (
    <>
      <PropField name={name} label="Steps" node={node} siteId="site-1" onChange={setNode} />
      <output aria-label="value">{JSON.stringify(fromTree(node))}</output>
    </>
  );
}

const value = () => JSON.parse(screen.getByLabelText('value').textContent ?? 'null');

describe('PropArrayList', () => {
  it('counts the items and disables the moves past either end', () => {
    renderWithProviders(<Harness name="steps" initial={['a', 'b']} />);

    expect(screen.getByText('Steps (2)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move item 1 up' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move item 1 down' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Move item 2 up' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Move item 2 down' })).toBeDisabled();
  });

  it('reorders items up and down', async () => {
    renderWithProviders(<Harness name="steps" initial={['a', 'b', 'c']} />);

    await press('Move item 3 up');
    expect(value()).toEqual(['a', 'c', 'b']);

    await press('Move item 1 down');
    expect(value()).toEqual(['c', 'a', 'b']);
  });

  it('removes the item asked for', async () => {
    renderWithProviders(<Harness name="steps" initial={['a', 'b', 'c']} />);

    await press('Remove item 2');

    expect(value()).toEqual(['a', 'c']);
    expect(screen.getByText('Steps (2)')).toBeInTheDocument();
  });

  it('edits one item without touching the others', async () => {
    renderWithProviders(<Harness name="steps" initial={['a', 'b']} />);

    await userEvent.type(screen.getByLabelText('Item 2'), '!');

    expect(value()).toEqual(['a', 'b!']);
  });

  it('adds a new item shaped like the first one', async () => {
    renderWithProviders(<Harness name="steps" initial={[{ title: 'Plan', done: true }]} />);

    await press('Add item');

    expect(value()).toEqual([
      { title: 'Plan', done: true },
      { title: '', done: false },
    ]);
  });

  it('starts an empty list with a text item', async () => {
    renderWithProviders(<Harness name="steps" initial={[]} />);
    expect(screen.getByText('Steps (0)')).toBeInTheDocument();

    await press('Add item');

    expect(value()).toEqual(['']);
    expect(screen.getByLabelText('Item 1')).toHaveValue('');
  });

  it('opens a group of up to four props and folds a larger one', () => {
    renderWithProviders(
      <>
        <Harness name="small" initial={{ small: { a: 1 } }} />
        <Harness name="large" initial={{ large: { a: 1, b: 2, c: 3, d: 4, e: 5 } }} />
      </>,
    );

    expect(screen.getByRole('button', { name: 'Small' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Large' })).toHaveAttribute('aria-expanded', 'false');
  });
});
