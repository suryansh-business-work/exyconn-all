import type { Component, ComponentView, Editor } from 'grapesjs';
import { vi } from 'vitest';
import { headlessEditor } from '../test-utils';
import { cmsEditorPlugin } from '../../../src/cms';
import type { CmsCatalogueEntry, CmsFragmentOption } from '../../../src/cms/cms.types';

export const HERO: CmsCatalogueEntry = {
  key: 'hero',
  label: 'Hero',
  category: 'Marketing',
  description: 'Big banner',
  defaultProps: { title: 'Welcome' },
  acceptsChildren: false,
};

export const GRID: CmsCatalogueEntry = {
  key: 'grid',
  label: 'Grid',
  category: 'Layout',
  description: 'Holds blocks',
  defaultProps: {},
  acceptsChildren: true,
};

export const FOOTER: CmsFragmentOption = { id: 'f1', name: 'Site footer', kind: 'FOOTER' };

/** A headless editor with the CMS plugin, opened on `components`. */
export const cmsEditor = (components: string) => {
  const onEditComponent = vi.fn();
  const editor = headlessEditor({
    components,
    plugins: [cmsEditorPlugin({ components: [HERO, GRID], fragments: [FOOTER], onEditComponent })],
  });
  return { editor, onEditComponent };
};

export const first = (editor: Editor): Component => {
  const component = editor.getComponents().at(0);
  if (!component) {
    throw new Error('The editor has no component');
  }
  return component;
};

/** Renders a component through its registered view (a headless editor creates none). */
export const renderView = (editor: Editor, component: Component): ComponentView => {
  const View = editor.DomComponents.getType(component.get('type') ?? '')?.view;
  if (!View) {
    throw new Error('The component type has no view');
  }
  const view = new View({ model: component, config: {} });
  view.render();
  return view;
};
