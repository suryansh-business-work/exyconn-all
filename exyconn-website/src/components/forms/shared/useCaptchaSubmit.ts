import { useCallback, useEffect, useState } from "react";
import { SUBMIT_COPY } from "./copy";
import { fetchCaptcha, postFormSubmission } from "./postFormSubmission";

export type SubmitStatus = "idle" | "success" | "error";

const STATUS_RESET_MS = 5000;

interface CaptchaSubmitOptions {
  /** Shown when the captcha answer is wrong. */
  incorrectAnswer?: string;
  /** The question's placeholder while it loads. */
  loading?: string;
  /** Shown when the question could not be loaded. */
  loadFailed?: string;
  /** How long the thank-you banner stays up; the failure banner always stays 5s. */
  successResetMs?: number;
}

/**
 * The security question and the send step every website form shares. The question comes from
 * the portal and so does the verdict — the browser never knows the answer. `submit` runs after
 * the form's own validation has passed; every send, right or wrong, draws a new question.
 */
export function useCaptchaSubmit(
  formType: string,
  onSent: () => void,
  {
    incorrectAnswer = SUBMIT_COPY.incorrect,
    loading = SUBMIT_COPY.loading,
    loadFailed = SUBMIT_COPY.loadFailed,
    successResetMs = STATUS_RESET_MS,
  }: CaptchaSubmitOptions = {}
) {
  const [captcha, setCaptcha] = useState({ token: "", question: loading });
  const [captchaError, setCaptchaError] = useState("");
  const [status, setStatus] = useState<SubmitStatus>("idle");

  const loadCaptcha = useCallback(async () => {
    try {
      setCaptcha(await fetchCaptcha());
    } catch (error) {
      console.error("The security question could not be loaded", error);
      setCaptchaError(loadFailed);
    }
  }, [loadFailed]);

  // Loaded after mount: a question in the server-rendered HTML would be shared by every visitor.
  useEffect(() => {
    loadCaptcha().catch((error: unknown) => console.error(error));
  }, [loadCaptcha]);

  const refreshCaptcha = () => {
    setCaptchaError("");
    loadCaptcha().catch((error: unknown) => console.error(error));
  };

  const showStatus = (next: SubmitStatus, resetMs: number) => {
    setStatus(next);
    setTimeout(() => setStatus("idle"), resetMs);
  };

  const submit = async (answer: string, payload: Record<string, unknown>) => {
    setCaptchaError("");
    try {
      const outcome = await postFormSubmission(formType, payload, { token: captcha.token, answer });
      if (outcome === "captcha") {
        setCaptchaError(incorrectAnswer);
      } else {
        showStatus("success", successResetMs);
        onSent();
      }
    } catch (error) {
      console.error(`The ${formType} form could not be sent`, error);
      showStatus("error", STATUS_RESET_MS);
    }
    await loadCaptcha();
  };

  return { captcha, captchaError, refreshCaptcha, status, submit };
}
