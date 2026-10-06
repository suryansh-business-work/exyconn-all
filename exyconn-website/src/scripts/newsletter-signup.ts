/**
 * Every newsletter sign-up on the page (components/newsletter/NewsletterSignup.astro): checks
 * the address, then sends it with the security answer to /api/newsletter-subscribe.
 */
import { EMAIL } from "@exyconn/regex";
import { mountCaptcha, type MountedCaptcha } from "../lib/captcha-dom";

const ENDPOINT = "/api/newsletter-subscribe";

interface SignupParts {
  form: HTMLFormElement;
  captcha: MountedCaptcha;
  name: HTMLInputElement;
  email: HTMLInputElement;
  emailError: HTMLElement;
  button: HTMLButtonElement;
  success: HTMLElement;
  failure: HTMLElement;
}

function partsOf(form: HTMLFormElement): SignupParts | null {
  const id = form.dataset.newsletterSignup ?? "";
  const captcha = mountCaptcha(form, id, ENDPOINT);
  const name = form.querySelector<HTMLInputElement>('input[name="name"]');
  const email = form.querySelector<HTMLInputElement>('input[name="email"]');
  const emailError = form.querySelector<HTMLElement>("[data-email-error]");
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const success = form.querySelector<HTMLElement>("[data-signup-success]");
  const failure = form.querySelector<HTMLElement>("[data-signup-failure]");
  if (!captcha || !name || !email || !emailError || !button || !success || !failure) {
    return null;
  }
  return { form, captcha, name, email, emailError, button, success, failure };
}

/** Shows the address's error (or clears it); true when the address is valid. */
function checkEmail(parts: SignupParts): boolean {
  const valid = EMAIL.test(parts.email.value.trim());
  parts.emailError.textContent = valid ? "" : (parts.form.dataset.invalidEmail ?? "");
  parts.emailError.hidden = valid;
  parts.email.setAttribute("aria-invalid", String(!valid));
  return valid;
}

async function send(parts: SignupParts): Promise<void> {
  parts.success.hidden = true;
  parts.failure.hidden = true;
  if (!checkEmail(parts)) {
    parts.email.focus();
    return;
  }
  parts.button.disabled = true;
  parts.button.dataset.busy = "true";
  try {
    const payload = {
      email: parts.email.value.trim(),
      name: parts.name.value.trim(),
      source: globalThis.location.pathname,
    };
    // A wrong security answer is shown under the question itself.
    if ((await parts.captcha.send("newsletter", payload)) === "sent") {
      parts.success.hidden = false;
      parts.form.reset();
    }
  } catch (error) {
    console.error("Newsletter sign-up failed", error);
    parts.failure.hidden = false;
  } finally {
    parts.button.disabled = false;
    parts.button.dataset.busy = "false";
  }
}

document.querySelectorAll<HTMLFormElement>("form[data-newsletter-signup]").forEach((form) => {
  const parts = partsOf(form);
  if (!parts) {
    return;
  }
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    send(parts).catch((error: unknown) => console.error(error));
  });
});
