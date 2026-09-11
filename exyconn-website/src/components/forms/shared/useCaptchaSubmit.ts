import { useEffect, useState } from "react";
import { postFormSubmission } from "./postFormSubmission";

export type SubmitStatus = "idle" | "success" | "error";

const STATUS_RESET_MS = 5000;
const PENDING_CAPTCHA = { question: "? + ? = ?", answer: 0 };

interface CaptchaSubmitOptions {
  /** Shown when the captcha answer is wrong. */
  incorrectAnswer?: string;
  /** How long the thank-you banner stays up; the failure banner always stays 5s. */
  successResetMs?: number;
}

// A speed bump for bots, not a secret, so Math.random is enough.
const generateCaptcha = () => {
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  return { question: `${num1} + ${num2} = ?`, answer: num1 + num2 };
};

/**
 * The maths captcha and the send step every website form shares. `submit` runs after the
 * form's own validation has passed: a wrong answer draws a new question and sends nothing.
 */
export function useCaptchaSubmit(
  formType: string,
  onSent: () => void,
  {
    incorrectAnswer = "Incorrect answer. Please try again.",
    successResetMs = STATUS_RESET_MS,
  }: CaptchaSubmitOptions = {}
) {
  const [captcha, setCaptcha] = useState(PENDING_CAPTCHA);
  const [captchaError, setCaptchaError] = useState("");
  const [status, setStatus] = useState<SubmitStatus>("idle");

  // Drawn after mount so the server-rendered question can never mismatch on hydration.
  useEffect(() => {
    setCaptcha(generateCaptcha());
  }, []);

  const refreshCaptcha = () => {
    setCaptcha(generateCaptcha());
    setCaptchaError("");
  };

  const showStatus = (next: SubmitStatus, resetMs: number) => {
    setStatus(next);
    setTimeout(() => setStatus("idle"), resetMs);
  };

  const submit = async (answer: string, payload: Record<string, unknown>) => {
    if (Number.parseInt(answer, 10) !== captcha.answer) {
      setCaptcha(generateCaptcha());
      setCaptchaError(incorrectAnswer);
      return;
    }
    try {
      await postFormSubmission(formType, payload);
      showStatus("success", successResetMs);
      onSent();
      refreshCaptcha();
    } catch (error) {
      console.error(`The ${formType} form could not be sent`, error);
      showStatus("error", STATUS_RESET_MS);
    }
  };

  return { captcha, captchaError, refreshCaptcha, status, submit };
}
