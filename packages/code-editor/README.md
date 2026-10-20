# @exyconn/code-editor

The code field for the portals: [Monaco](https://microsoft.github.io/monaco-editor/) for HTML, CSS, JSON and MJML.

- **Bundled.** Monaco and its workers ship from the app's own build, never from a CDN. Only the editor core and the HTML, CSS and JSON languages are imported. The full entry would also pull in the 7 MB TypeScript worker.
- **Lazy.** The editor chunk loads the first time a code field renders, and the shared PWA config (`packages/config/vite.js`) leaves it out of the precache.
- **Format.** The Format button (or Shift+Alt+F) runs Monaco's own formatter for the language.
- **Problems.** A live list under the editor shows what is wrong. JSON and CSS come from Monaco's language services. HTML and MJML come from `htmlProblems`, a tag-pairing check, because Monaco has no HTML diagnostics. MJML is edited as `html`.

## Use

In a React Hook Form form, use the shell binding:

```tsx
import { RhfCodeEditor } from '@exyconn/shell/components/form/rhf';

<RhfCodeEditor name="globalCss" label="Global CSS" language="css" height={280} />;
```

Without a form, use `CodeEditor` directly. Its strings must already be translated:

```tsx
import { CodeEditor } from '@exyconn/code-editor';

<CodeEditor value={html} onChange={setHtml} language="html" label={t('Source')} />;
```

The problems list is advisory and does not block a save. A field that must be valid (such as JSON-LD or component settings) still needs its Zod rule.

## Inserting text and showing outside problems

- `onReady(api)` is called once Monaco is mounted. `api.insertAtCursor(text)` replaces the
  selection with `text` as one undoable edit (the Email Studio inserts `{{contact.firstName}}`
  this way); `api.focus()` focuses the editor.
- `problems` takes findings from outside the editor — the server's MJML compiler, for
  instance — and shows them in the gutter and the problems list with the editor's own.
  Find/replace (Ctrl/Cmd+F, Ctrl/Cmd+H), undo/redo and Format are Monaco's built-ins.
