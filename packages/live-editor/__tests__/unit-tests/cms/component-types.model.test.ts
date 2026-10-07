import { describe, expect, it } from 'vitest';
import { COMPONENT_TYPE, FRAGMENT_TYPE } from '../../../src/cms';
import { cmsEditor, first } from './cms-fixtures';

describe('dynamic component type', () => {
  it('recognises the placeholder tag and names it after the catalogue entry', () => {
    const { editor } = cmsEditor('<exy-component data-key="hero" data-props="{}"></exy-component>');
    const component = first(editor);
    expect(component.get('type')).toBe(COMPONENT_TYPE);
    expect(component.get('name')).toBe('Hero');
    expect(component.get('droppable')).toBe(false);
    expect(component.get('stylable')).toBe(false);
  });

  it('becomes a drop zone for an entry that accepts children, and keeps them in its HTML', () => {
    const { editor } = cmsEditor(
      '<exy-component data-key="grid" data-props="{&quot;cols&quot;:2}"><p>Inside</p></exy-component>',
    );
    const component = first(editor);
    expect(component.get('droppable')).toBe(true);
    expect(editor.getHtml()).toContain(
      '<exy-component data-key="grid" data-props="{&quot;cols&quot;:2}"><p>Inside</p></exy-component>',
    );
  });

  it('names an unknown component by its key, and an unkeyed one by nothing', () => {
    const { editor } = cmsEditor(
      '<exy-component data-key="gone"></exy-component><exy-component></exy-component>',
    );
    const [unknown, unkeyed] = editor.getComponents().models;
    expect(unknown.get('name')).toBe('gone');
    expect(unknown.get('droppable')).toBe(false);
    expect(unkeyed.get('name')).toBe('');
    expect(unkeyed.toHTML()).toBe('<exy-component data-key="" data-props="{}"></exy-component>');
  });

  it('re-syncs its name and drop zone when its key changes', () => {
    const { editor } = cmsEditor('<exy-component data-key="hero"></exy-component>');
    const component = first(editor);
    component.addAttributes({ 'data-key': 'grid' });
    expect(component.get('name')).toBe('Grid');
    expect(component.get('droppable')).toBe(true);
  });

  it('writes props that are not valid JSON back unchanged', () => {
    const { editor } = cmsEditor(
      '<exy-component data-key="hero" data-props="{oops"></exy-component>',
    );
    expect(editor.getHtml()).toContain(
      '<exy-component data-key="hero" data-props="{oops"></exy-component>',
    );
  });
});

describe('fragment type', () => {
  it('drops the preview content and writes only the placeholder', () => {
    const { editor } = cmsEditor(
      '<exy-fragment data-fragment-id="f1"><p>Preview</p></exy-fragment>',
    );
    const fragment = first(editor);
    expect(fragment.get('type')).toBe(FRAGMENT_TYPE);
    expect(fragment.components()).toHaveLength(0);
    expect(fragment.toHTML()).toBe('<exy-fragment data-fragment-id="f1"></exy-fragment>');
  });

  it('writes an empty id when none is set', () => {
    const { editor } = cmsEditor('<exy-fragment></exy-fragment>');
    expect(first(editor).toHTML()).toBe('<exy-fragment data-fragment-id=""></exy-fragment>');
  });

  it('offers every fragment of the site in its select trait', () => {
    const { editor } = cmsEditor('<exy-fragment data-fragment-id="f1"></exy-fragment>');
    const trait = first(editor).getTrait('data-fragment-id');
    expect(trait?.get('type')).toBe('select');
    expect(trait?.get('options')).toEqual([{ id: 'f1', label: 'Site footer (footer)' }]);
  });

  it('leaves plain HTML to the default types', () => {
    const { editor } = cmsEditor('<section><p>Plain text</p></section>');
    expect([COMPONENT_TYPE, FRAGMENT_TYPE]).not.toContain(first(editor).get('type'));
    expect(editor.getHtml()).toContain('<section><p>Plain text</p></section>');
  });
});
