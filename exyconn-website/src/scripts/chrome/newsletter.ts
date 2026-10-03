/** The footer newsletter form: sends the address with the security answer (lib/captcha-dom). */
import { mountCaptcha } from "../../lib/captcha-dom";

const captcha = mountCaptcha(document, "newsletter");
const form = document.getElementById("newsletter-form");
const email = document.getElementById("newsletter-email");
const button = document.getElementById("newsletter-btn");
const success = document.getElementById("newsletter-success");
const failure = document.getElementById("newsletter-error");

const ready =
  captcha &&
  form instanceof HTMLFormElement &&
  email instanceof HTMLInputElement &&
  button instanceof HTMLButtonElement &&
  success &&
  failure;

if (ready) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const address = email.value.trim();
    if (!address) {
      return;
    }
    button.disabled = true;
    button.dataset.busy = "true";
    success.hidden = true;
    failure.hidden = true;
    try {
      // A wrong security answer is shown under the question itself.
      if ((await captcha.send("newsletter", { email: address })) === "sent") {
        success.hidden = false;
        email.value = "";
      }
    } catch (error) {
      console.error("Newsletter sign-up failed", error);
      failure.hidden = false;
    } finally {
      button.disabled = false;
      button.dataset.busy = "false";
    }
  });
}
