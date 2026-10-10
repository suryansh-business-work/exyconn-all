import { describe, expect, it } from 'vitest';
import type { Editor, Trait } from 'grapesjs';
import { EMBED_TYPE } from '../../../src/cms/embed-type';
import { cmsEditor, first } from './cms-fixtures';

/** Renders a trait through its registered view and returns its textarea. */
const renderTrait = (editor: Editor, trait: Trait): HTMLTextAreaElement => {
  const TraitType = editor.TraitManager.getType(trait.get('type') ?? '');
  if (!TraitType) {
    throw new Error('The trait type is not registered');
  }
  const view = new TraitType({ model: trait, config: { em: editor.getModel() } });
  view.render();
  const input = view.el.querySelector('textarea');
  if (!input) {
    throw new Error('The trait rendered no textarea');
  }
  return input;
};

const embedEditor = () => cmsEditor('<div data-exy-embed=""><p>Map</p></div>');

describe('HTML embed type', () => {
  it('recognises the embed attribute and keeps its markup', () => {
    const { editor } = embedEditor();
    const embed = first(editor);
    expect(embed.get('type')).toBe(EMBED_TYPE);
    expect(embed.get('name')).toBe('HTML embed');
    expect(editor.getHtml()).toContain('<div data-exy-embed=""><p>Map</p></div>');
  });

  it('replaces its content when the code changes, and empties it when cleared', () => {
    const { editor } = embedEditor();
    const embed = first(editor);
    embed.set('embedHtml', '<form action="/x"><p>Sign up</p></form>');
    expect(embed.getInnerHTML()).toBe('<form action="/x"><p>Sign up</p></form>');
    embed.unset('embedHtml');
    expect(embed.components()).toHaveLength(0);
  });
});

describe('code trait', () => {
  it('renders a labelled monospace textarea showing the current markup', () => {
    const { editor } = embedEditor();
    const input = renderTrait(editor, first(editor).getTraits()[0]);
    expect(input).toHaveAttribute('aria-label', 'HTML');
    expect(input.rows).toBe(10);
    expect(input.spellcheck).toBe(false);
    expect(input.style.fontFamily).toBe('monospace');
    expect(input.value).toBe('<p>Map</p>');
  });

  it('writes typed code into the component', () => {
    const { editor } = embedEditor();
    const embed = first(editor);
    const input = renderTrait(editor, embed.getTraits()[0]);
    input.value = '<span>Form</span>';
    input.dispatchEvent(new Event('change', { bubbles: true }));
    expect(embed.get('embedHtml')).toBe('<span>Form</span>');
    expect(editor.getHtml()).toContain('<div data-exy-embed=""><span>Form</span></div>');
  });

  it('starts from the stored code', () => {
    const { editor } = embedEditor();
    const embed = first(editor);
    embed.set('embedHtml', '<b>Stored</b>');
    expect(renderTrait(editor, embed.getTraits()[0]).value).toBe('<b>Stored</b>');
  });

  it('shows no code, and leaves the embed empty, when the stored code is null', () => {
    const { editor } = embedEditor();
    const embed = first(editor);
    const [trait] = embed.addTrait([{ type: 'exy-code', name: 'other', changeProp: true }]);
    embed.set('other', null);
    embed.set('embedHtml', null);
    expect(embed.components()).toHaveLength(0);
    expect(renderTrait(editor, trait).value).toBe('');
  });

  it('labels an unlabelled trait as HTML', () => {
    const { editor } = embedEditor();
    const [trait] = first(editor).addTrait([{ type: 'exy-code', name: 'other', changeProp: true }]);
    trait.set('label', undefined);
    expect(renderTrait(editor, trait)).toHaveAttribute('aria-label', 'HTML');
  });
});
