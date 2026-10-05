import type { ChatActions } from '../controller';
import { h, icon, on } from '../dom';
import { MAX_FILES, isTooBig, kindOf, readDataUrl } from '../files';
import { icons } from '../icons';
import { strings } from '../strings';
import type { OutgoingFile } from '../types';

interface Pending extends OutgoingFile {
  id: number;
  kind: 'IMAGE' | 'VIDEO';
}

export interface AttachPicker {
  button: HTMLButtonElement;
  input: HTMLInputElement;
  previews: HTMLElement;
  files(): OutgoingFile[];
  clear(): void;
  setMaxMb(mb: number): void;
}

function preview(file: Readonly<Pending>, onRemove: () => void): HTMLElement {
  const media =
    file.kind === 'VIDEO'
      ? h('video', { src: file.data, muted: true, class: 'cw-thumb', 'aria-label': file.name })
      : h('img', { src: file.data, alt: file.name, class: 'cw-thumb' });
  const remove = h('button', {
    type: 'button',
    class: 'cw-thumb-remove',
    'aria-label': strings.removeFile(file.name),
  });
  remove.append(icon(icons.close));
  on(remove, 'click', onRemove);
  return h('div', { class: 'cw-preview' }, media, remove);
}

/** The paperclip: up to four pictures or clips under the size limit, previewed before sending. */
export function createAttach(actions: Readonly<ChatActions>): AttachPicker {
  const input = h('input', {
    type: 'file',
    accept: 'image/*,video/*',
    multiple: true,
    hidden: true,
  });
  const button = h('button', {
    type: 'button',
    class: 'cw-icon-button',
    'aria-label': strings.attach,
  });
  button.append(icon(icons.attach));
  const previews = h('div', { class: 'cw-previews', hidden: true });
  let pending: Pending[] = [];
  let maxMb = 10;
  let nextId = 0;

  const render = (): void => {
    previews.hidden = pending.length === 0;
    previews.replaceChildren(
      ...pending.map((file) =>
        preview(file, () => {
          pending = pending.filter((candidate) => candidate.id !== file.id);
          render();
        }),
      ),
    );
  };

  /** The reason a file cannot be attached, or null when it can. */
  const problemWith = (file: File): string | null => {
    const kind = kindOf(file.type);
    if (kind !== 'IMAGE' && kind !== 'VIDEO') {
      return strings.fileType(file.name);
    }
    return isTooBig(file.size, maxMb) ? strings.fileTooBig(file.name, maxMb) : null;
  };

  const add = async (file: File): Promise<void> => {
    const problem = problemWith(file);
    if (problem) {
      actions.showError(problem);
      return;
    }
    if (pending.length >= MAX_FILES) {
      actions.showError(strings.tooManyFiles);
      return;
    }
    const data = await readDataUrl(file);
    const kind = kindOf(file.type) === 'VIDEO' ? 'VIDEO' : 'IMAGE';
    pending = [...pending, { id: nextId, name: file.name.slice(0, 120), data, kind }];
    nextId += 1;
  };

  on(button, 'click', () => input.click());
  on(input, 'change', () => {
    const chosen = [...(input.files ?? [])];
    input.value = '';
    chosen
      .reduce((chain, file) => chain.then(() => add(file)), Promise.resolve())
      .catch((error: unknown) => {
        console.warn('[chat-widget] could not read a file', error);
        actions.showError(strings.fileUnreadable);
      })
      .finally(render);
  });

  return {
    button,
    input,
    previews,
    files: () => pending.map(({ name, data }) => ({ name, data })),
    clear() {
      pending = [];
      render();
    },
    setMaxMb(mb) {
      maxMb = mb;
    },
  };
}
