import * as monaco from 'monaco-editor/editor/editor.api';
// The editor's features (find, format, folding…) and only the three languages the fields edit:
// the full entry also bundles TypeScript, a 7 MB worker no field uses.
import 'monaco-editor/features/register.all';
import 'monaco-editor/languages/definitions/css/register';
import 'monaco-editor/languages/definitions/html/register';
import 'monaco-editor/languages/features/css/register';
import 'monaco-editor/languages/features/html/register';
import 'monaco-editor/languages/features/json/register';
import { loader } from '@monaco-editor/react';
import EditorWorker from 'monaco-editor/editor/editor.worker?worker';
import JsonWorker from 'monaco-editor/language/json/json.worker?worker';
import CssWorker from 'monaco-editor/language/css/css.worker?worker';
import HtmlWorker from 'monaco-editor/language/html/html.worker?worker';

/**
 * Monaco from the app's own bundle, never a CDN: the portals' pages load nothing from third
 * parties. Each language service runs in its own worker, built by Vite alongside the app.
 */
globalThis.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    if (label === 'json') return new JsonWorker();
    if (label === 'css') return new CssWorker();
    if (label === 'html') return new HtmlWorker();
    return new EditorWorker();
  },
};

loader.config({ monaco });

export { monaco };
