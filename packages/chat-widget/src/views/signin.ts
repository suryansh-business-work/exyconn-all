import type { ChatActions } from '../controller';
import { h, isSafeUrl, on } from '../dom';
import type { ChatState } from '../store/state';
import { strings } from '../strings';
import { validateIdentity } from '../validation';
import { createCodeStep } from './code';
import { createField } from './field';
import type { View } from './view';

/** Who the visitor is (name, email, optional phone), then the emailed code. */
export function createSignIn(actions: Readonly<ChatActions>, privacyUrl?: string): View {
  const name = createField('cw-name', strings.name, {
    autocomplete: 'name',
    maxlength: '120',
    required: true,
  });
  const email = createField('cw-email', strings.email, {
    type: 'email',
    autocomplete: 'email',
    inputmode: 'email',
    required: true,
  });
  const phone = createField('cw-phone', strings.phone, { type: 'tel', autocomplete: 'tel' });
  const submit = h(
    'button',
    { type: 'submit', class: 'cw-button cw-primary' },
    strings.requestCode,
  );
  const privacy =
    privacyUrl && isSafeUrl(privacyUrl)
      ? h(
          'a',
          { href: privacyUrl, target: '_blank', rel: 'noopener noreferrer', class: 'cw-link' },
          strings.privacy,
        )
      : null;
  const form = h(
    'form',
    { class: 'cw-form', novalidate: true, 'aria-labelledby': 'cw-signin-title' },
    h('h3', { id: 'cw-signin-title', class: 'cw-form-title' }, strings.signInTitle),
    h('p', { class: 'cw-muted' }, strings.signInIntro),
    name.el,
    email.el,
    phone.el,
    submit,
    privacy,
  );
  on(form, 'submit', (event) => {
    event.preventDefault();
    const identity = {
      name: name.input.value.trim(),
      email: email.input.value.trim().toLowerCase(),
      phone: phone.input.value.trim(),
    };
    const errors = validateIdentity(identity);
    name.setError(errors.name);
    email.setError(errors.email);
    phone.setError(errors.phone);
    const firstInvalid = [name, email, phone].find((field) =>
      field.input.hasAttribute('aria-invalid'),
    );
    if (firstInvalid) {
      firstInvalid.input.focus();
      return;
    }
    actions.requestCode(identity);
  });

  const code = createCodeStep(actions);
  const el = h('div', { class: 'cw-signin' }, form, code.el);

  return {
    el,
    update(state: Readonly<ChatState>, previous: Readonly<ChatState>) {
      form.hidden = state.step !== 'form';
      submit.disabled = state.busy || state.connection !== 'open';
      code.update(state, previous);
    },
  };
}
