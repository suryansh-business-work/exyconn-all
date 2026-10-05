import { h, setAttr } from '../dom';

export interface Field {
  el: HTMLDivElement;
  input: HTMLInputElement;
  setError(message: string | undefined): void;
}

/** A labelled input with its own error line, wired up with aria-invalid/aria-describedby. */
export function createField(
  id: string,
  label: string,
  attrs: Readonly<Record<string, string | boolean>>,
): Field {
  const errorId = `${id}-error`;
  const input = h('input', { id, class: 'cw-input', ...attrs });
  const error = h('p', { id: errorId, class: 'cw-field-error', hidden: true });
  const el = h('div', { class: 'cw-field' }, h('label', { for: id }, label), input, error);
  return {
    el,
    input,
    setError(message) {
      error.hidden = !message;
      error.textContent = message ?? '';
      setAttr(input, 'aria-invalid', message ? 'true' : undefined);
      setAttr(input, 'aria-describedby', message ? errorId : undefined);
    },
  };
}
