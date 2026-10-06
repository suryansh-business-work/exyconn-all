import type { Editor } from 'grapesjs';
import type { CmsPluginOptions } from './cms.types';
import { registerCmsComponentTypes } from './component-types';
import { registerEmbedType } from './embed-type';
import { addHistoryButtons } from './history-buttons';

export type {
  CmsCatalogueEntry,
  CmsEditRequest,
  CmsFragmentOption,
  CmsPluginOptions,
} from './cms.types';
export { cmsBlocks } from './cms-blocks';
export { PLACEHOLDER_CSS } from './canvas-css';
export { COMPONENT_TYPE, FRAGMENT_TYPE } from './component-types';

/**
 * The site-page builder's additions to GrapesJS: the dynamic-component and fragment
 * placeholders, the HTML embed block and undo/redo. Hand it to `LiveEditor`'s `plugins`.
 */
export const cmsEditorPlugin =
  (options: CmsPluginOptions) =>
  (editor: Editor): void => {
    registerCmsComponentTypes(editor, options);
    registerEmbedType(editor);
    addHistoryButtons(editor);
  };
