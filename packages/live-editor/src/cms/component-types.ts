import type { Component, ComponentView, Editor } from 'grapesjs';
import { COMPONENT_TAG, FRAGMENT_TAG } from '@exyconn/cms';
import type { CmsPluginOptions } from './cms.types';
import { componentHtml, fragmentHtml, parseProps, propsSummary } from './placeholders';

export const COMPONENT_TYPE = COMPONENT_TAG;
export const FRAGMENT_TYPE = FRAGMENT_TAG;
export const EDIT_PROPS_COMMAND = 'exy:edit-props';

const tagIs = (el: HTMLElement, tag: string): boolean => el.tagName?.toLowerCase() === tag;

const childrenHtml = (component: Component, opts?: object): string =>
  component
    .components()
    .map((child: Component) => child.toHTML(opts))
    .join('');

/**
 * Registers the two placeholder types @exyconn/cms compiles: a dynamic component (a labelled
 * card on the canvas, a drop zone when it renders children, settings through the host's props
 * form) and a fragment (a card naming the fragment, switched with a trait). Both write exactly
 * the placeholder HTML the compiler reads, whatever GrapesJS would have written for them.
 */
export function registerCmsComponentTypes(editor: Editor, options: CmsPluginOptions): void {
  const byKey = new Map(options.components.map((entry) => [entry.key, entry]));
  const fragmentById = new Map(options.fragments.map((fragment) => [fragment.id, fragment]));

  const paintComponent = (view: ComponentView) => {
    const attributes = view.model.getAttributes();
    const key = String(attributes['data-key'] ?? '');
    const entry = byKey.get(key);
    const title = entry ? `${entry.label} · ${entry.category}` : `Unknown component ${key}`;
    view.el.dataset.exyTitle = title;
    view.el.dataset.exySummary = propsSummary(parseProps(attributes['data-props']));
    view.el.toggleAttribute('data-exy-container', Boolean(entry?.acceptsChildren));
  };

  const paintFragment = (view: ComponentView) => {
    const id = String(view.model.getAttributes()['data-fragment-id'] ?? '');
    const fragment = fragmentById.get(id);
    view.el.dataset.exyTitle = fragment ? `Fragment · ${fragment.name}` : 'Fragment · not found';
    view.el.dataset.exySummary = fragment
      ? `${fragment.kind} — edited in Website › Fragments`
      : 'Pick a fragment in the settings panel.';
  };

  editor.Commands.add(EDIT_PROPS_COMMAND, {
    run(ed) {
      const selected = ed.getSelected();
      if (!selected || selected.get('type') !== COMPONENT_TYPE) return;
      const attributes = selected.getAttributes();
      const key = String(attributes['data-key'] ?? '');
      options.onEditComponent({
        key,
        label: byKey.get(key)?.label ?? key,
        props: parseProps(attributes['data-props']) ?? {},
        apply: (props) => selected.addAttributes({ 'data-props': JSON.stringify(props) }),
      });
    },
  });

  editor.DomComponents.addType(COMPONENT_TYPE, {
    isComponent: (el) => tagIs(el, COMPONENT_TAG),
    model: {
      defaults: {
        tagName: COMPONENT_TAG,
        name: 'Dynamic component',
        stylable: false,
        editable: false,
        droppable: false,
        traits: [
          {
            type: 'button',
            label: false,
            text: 'Edit settings',
            full: true,
            command: EDIT_PROPS_COMMAND,
          },
        ],
      },
      init() {
        const sync = () => {
          const key = String(this.getAttributes()['data-key'] ?? '');
          const entry = byKey.get(key);
          this.set({ droppable: Boolean(entry?.acceptsChildren), name: entry?.label ?? key });
        };
        sync();
        this.on('change:attributes', sync);
      },
      toHTML(opts?: object) {
        const attributes = this.getAttributes();
        const key = String(attributes['data-key'] ?? '');
        return componentHtml(key, attributes['data-props'], childrenHtml(this, opts));
      },
    },
    view: {
      init() {
        this.listenTo(this.model, 'change:attributes', () => paintComponent(this));
      },
      onRender() {
        paintComponent(this);
      },
    },
  });

  editor.DomComponents.addType(FRAGMENT_TYPE, {
    isComponent: (el) => tagIs(el, FRAGMENT_TAG),
    model: {
      defaults: {
        tagName: FRAGMENT_TAG,
        name: 'Fragment',
        stylable: false,
        editable: false,
        droppable: false,
        traits: [
          {
            type: 'select',
            name: 'data-fragment-id',
            label: 'Fragment',
            options: options.fragments.map((fragment) => ({
              id: fragment.id,
              label: `${fragment.name} (${fragment.kind.toLowerCase()})`,
            })),
          },
        ],
      },
      init() {
        // A fragment's own content in the editor is only a preview; the website renders it.
        this.components('');
      },
      toHTML() {
        return fragmentHtml(String(this.getAttributes()['data-fragment-id'] ?? ''));
      },
    },
    view: {
      init() {
        this.listenTo(this.model, 'change:attributes', () => paintFragment(this));
      },
      onRender() {
        paintFragment(this);
      },
    },
  });
}
