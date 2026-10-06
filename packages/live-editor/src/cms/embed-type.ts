import type { Editor } from 'grapesjs';

export const EMBED_TYPE = 'exy-embed';
const EMBED_ATTRIBUTE = 'data-exy-embed';
const CODE_TRAIT = 'exy-code';

/**
 * A block of hand-written HTML (a map, a form from another service). Its markup is edited as
 * code in the settings panel and then shown on the canvas like any other HTML.
 */
export function registerEmbedType(editor: Editor): void {
  editor.TraitManager.addType(CODE_TRAIT, {
    createInput({ trait }) {
      const input = document.createElement('textarea');
      input.rows = 10;
      input.spellcheck = false;
      input.setAttribute('aria-label', String(trait.get('label') ?? 'HTML'));
      input.style.width = '100%';
      input.style.fontFamily = 'monospace';
      input.value = String(trait.getValue() ?? '');
      return input;
    },
    onEvent({ elInput, component }) {
      // The input is the textarea made above; both expose `value`.
      component.set('embedHtml', elInput.value);
    },
    onUpdate({ elInput, component }) {
      elInput.value = component.getInnerHTML();
    },
  });

  editor.DomComponents.addType(EMBED_TYPE, {
    isComponent: (el) => el.hasAttribute?.(EMBED_ATTRIBUTE),
    model: {
      defaults: {
        tagName: 'div',
        name: 'HTML embed',
        attributes: { [EMBED_ATTRIBUTE]: '' },
        traits: [{ type: CODE_TRAIT, name: 'embedHtml', label: 'HTML', changeProp: true }],
      },
      init() {
        this.on('change:embedHtml', () => this.components(String(this.get('embedHtml') ?? '')));
      },
    },
  });
}
