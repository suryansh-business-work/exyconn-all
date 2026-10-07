import { describe, expect, it } from 'vitest';
import { EDIT_PROPS_COMMAND } from '../../../src/cms/component-types';
import { cmsEditor, first, renderView } from './cms-fixtures';

describe('dynamic component view', () => {
  it('labels a known component with its category and props', () => {
    const { editor } = cmsEditor(
      '<exy-component data-key="hero" data-props="{&quot;title&quot;:&quot;Hi&quot;}"></exy-component>',
    );
    const { el } = renderView(editor, first(editor));
    expect(el.dataset.exyTitle).toBe('Hero · Marketing');
    expect(el.dataset.exySummary).toBe('title: Hi');
    expect(el).not.toHaveAttribute('data-exy-container');
  });

  it('marks a component that accepts children as a container', () => {
    const { editor } = cmsEditor('<exy-component data-key="grid"></exy-component>');
    const { el } = renderView(editor, first(editor));
    expect(el).toHaveAttribute('data-exy-container');
    expect(el.dataset.exySummary).toBe('Default settings');
  });

  it('labels an unknown or unkeyed component and repaints when attributes change', () => {
    const { editor } = cmsEditor(
      '<exy-component data-key="gone"></exy-component><exy-component></exy-component>',
    );
    const [unknown, unkeyed] = editor.getComponents().models;
    const view = renderView(editor, unknown);
    expect(view.el.dataset.exyTitle).toBe('Unknown component gone');
    expect(renderView(editor, unkeyed).el.dataset.exyTitle).toBe('Unknown component ');
    unknown.addAttributes({ 'data-key': 'grid', 'data-props': '[1]' });
    expect(view.el.dataset.exyTitle).toBe('Grid · Layout');
    expect(view.el.dataset.exySummary).toBe(
      'Settings are not valid JSON: open the settings to fix them.',
    );
    expect(view.el).toHaveAttribute('data-exy-container');
  });
});

describe('fragment view', () => {
  it('names a known fragment and where it is edited', () => {
    const { editor } = cmsEditor('<exy-fragment data-fragment-id="f1"></exy-fragment>');
    const { el } = renderView(editor, first(editor));
    expect(el.dataset.exyTitle).toBe('Fragment · Site footer');
    expect(el.dataset.exySummary).toBe('FOOTER — edited in Website › Fragments');
  });

  it('asks for a fragment when none is picked, and repaints once one is', () => {
    const { editor } = cmsEditor('<exy-fragment></exy-fragment>');
    const fragment = first(editor);
    const { el } = renderView(editor, fragment);
    expect(el.dataset.exyTitle).toBe('Fragment · not found');
    expect(el.dataset.exySummary).toBe('Pick a fragment in the settings panel.');
    fragment.addAttributes({ 'data-fragment-id': 'f1' });
    expect(el.dataset.exyTitle).toBe('Fragment · Site footer');
  });
});

describe('edit-props command', () => {
  it('does nothing without a selection or on another type', () => {
    const { editor, onEditComponent } = cmsEditor('<p>Text</p>');
    editor.runCommand(EDIT_PROPS_COMMAND);
    editor.select(first(editor));
    editor.runCommand(EDIT_PROPS_COMMAND);
    expect(onEditComponent).not.toHaveBeenCalled();
  });

  it('opens the host form with the props and writes the result back', () => {
    const { editor, onEditComponent } = cmsEditor(
      '<exy-component data-key="hero" data-props="{&quot;title&quot;:&quot;Hi&quot;}"></exy-component>',
    );
    const component = first(editor);
    editor.select(component);
    editor.runCommand(EDIT_PROPS_COMMAND);
    expect(onEditComponent).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'hero', label: 'Hero', props: { title: 'Hi' } }),
    );
    onEditComponent.mock.calls[0][0].apply({ title: 'Bye' });
    expect(component.getAttributes()['data-props']).toBe('{"title":"Bye"}');
  });

  it('falls back to the key as label and to empty props when they are invalid', () => {
    const { editor, onEditComponent } = cmsEditor(
      '<exy-component data-key="gone" data-props="{oops"></exy-component><exy-component></exy-component>',
    );
    const [unknown, unkeyed] = editor.getComponents().models;
    editor.select(unknown);
    editor.runCommand(EDIT_PROPS_COMMAND);
    editor.select(unkeyed);
    editor.runCommand(EDIT_PROPS_COMMAND);
    expect(
      onEditComponent.mock.calls.map(([request]) => [request.key, request.label, request.props]),
    ).toEqual([
      ['gone', 'gone', {}],
      ['', '', {}],
    ]);
  });
});
