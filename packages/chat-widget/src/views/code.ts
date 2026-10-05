import type { ChatActions } from '../controller';
import { h, on } from '../dom';
import type { ChatState } from '../store/state';
import { strings } from '../strings';
import { isValidCode } from '../validation';
import { createField } from './field';
import type { View } from './view';

const RESEND_AFTER_MS = 30_000;

/** "We emailed a code to …": the 6-digit code, resend after 30 s, or change the email. */
export function createCodeStep(actions: Readonly<ChatActions>): View {
  const sentTo = h('p', { class: 'cw-muted', role: 'status' });
  const code = createField('cw-code', strings.code, {
    inputmode: 'numeric',
    autocomplete: 'one-time-code',
    maxlength: '6',
    pattern: String.raw`\d{6}`,
  });
  const verify = h('button', { type: 'submit', class: 'cw-button cw-primary' }, strings.verify);
  const resend = h('button', { type: 'button', class: 'cw-button cw-quiet' }, strings.resend);
  const change = h('button', { type: 'button', class: 'cw-button cw-quiet' }, strings.changeEmail);
  const el = h(
    'form',
    { class: 'cw-form', novalidate: true, 'aria-labelledby': 'cw-code-title', hidden: true },
    h('h3', { id: 'cw-code-title', class: 'cw-form-title' }, strings.codeTitle),
    sentTo,
    code.el,
    verify,
    h('div', { class: 'cw-row-actions' }, resend, change),
  );
  let codeSentAt = 0;
  let ticker: ReturnType<typeof setInterval> | undefined;

  const refreshResend = (): void => {
    const wait = Math.ceil((codeSentAt + RESEND_AFTER_MS - Date.now()) / 1000);
    resend.disabled = wait > 0;
    resend.textContent = wait > 0 ? strings.resendIn(wait) : strings.resend;
    if (wait <= 0) {
      clearInterval(ticker);
    }
  };

  on(el, 'submit', (event) => {
    event.preventDefault();
    const value = code.input.value.trim();
    const valid = isValidCode(value);
    code.setError(valid ? undefined : strings.codeInvalid);
    if (valid) {
      actions.verifyCode(value);
    } else {
      code.input.focus();
    }
  });
  on(resend, 'click', () => actions.resendCode());
  on(change, 'click', () => actions.changeEmail());

  return {
    el,
    update(state: Readonly<ChatState>, previous: Readonly<ChatState>) {
      el.hidden = state.step !== 'code';
      verify.disabled = state.busy || state.connection !== 'open';
      sentTo.textContent = strings.codeSentTo(state.identity.email);
      if (state.codeSentAt === codeSentAt) {
        return;
      }
      codeSentAt = state.codeSentAt;
      code.input.value = '';
      code.setError(undefined);
      clearInterval(ticker);
      ticker = setInterval(refreshResend, 1000);
      refreshResend();
      if (previous.step !== 'code') {
        code.input.focus();
      }
    },
  };
}
