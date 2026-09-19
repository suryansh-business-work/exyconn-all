import {
  fetchCaptcha,
  postFormSubmission,
  type SendOutcome,
} from "../components/forms/shared/postFormSubmission";

/** A mounted CaptchaBlock: send a form with it, and it draws a new question afterwards. */
export interface MountedCaptcha {
  /** Sends the form with the current answer. Resolves "captcha" when the answer was wrong. */
  send: (formType: string, payload: Record<string, unknown>) => Promise<SendOutcome>;
  /** Shows or clears the message under the question. */
  setError: (message: string) => void;
}

const LOAD_FAILED = "The security question could not be loaded. Please try a new one.";
const WRONG_ANSWER = "That answer was not right. Please try the new question.";

/** Brings a CaptchaBlock to life. Returns null if the block is not on the page. */
export function mountCaptcha(root: ParentNode, id: string): MountedCaptcha | null {
  const block = root.querySelector<HTMLElement>(`[data-captcha="${id}"]`);
  const question = block?.querySelector<HTMLElement>("[data-captcha-question]");
  const input = block?.querySelector<HTMLInputElement>("[data-captcha-answer]");
  const refresh = block?.querySelector<HTMLButtonElement>("[data-captcha-refresh]");
  const error = block?.querySelector<HTMLElement>("[data-captcha-error]");
  if (!question || !input || !refresh || !error) return null;

  let token = "";
  const setError = (message: string) => {
    error.textContent = message;
    error.classList.toggle("hidden", message === "");
    input.setAttribute("aria-invalid", String(message !== ""));
  };
  const load = async () => {
    question.textContent = "Loading…";
    input.value = "";
    try {
      const next = await fetchCaptcha();
      token = next.token;
      question.textContent = next.question;
    } catch (cause) {
      console.error(cause);
      setError(LOAD_FAILED);
    }
  };

  refresh.addEventListener("click", () => {
    setError("");
    load().catch((cause: unknown) => console.error(cause));
  });
  load().catch((cause: unknown) => console.error(cause));

  return {
    setError,
    send: async (formType, payload) => {
      setError("");
      try {
        const outcome = await postFormSubmission(formType, payload, {
          token,
          answer: input.value.trim(),
        });
        if (outcome === "captcha") setError(WRONG_ANSWER);
        return outcome;
      } finally {
        // Every question is good for one answer, right or wrong.
        await load();
      }
    },
  };
}
