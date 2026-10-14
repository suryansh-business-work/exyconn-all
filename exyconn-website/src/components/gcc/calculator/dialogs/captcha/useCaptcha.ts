import { useCallback, useEffect, useState } from "react";
import { fetchCaptcha } from "../../../../forms/shared/postFormSubmission";

export interface CaptchaState {
  token: string;
  question: string;
  failed: boolean;
}

/**
 * The site's security question for a dialog that sends something. Loaded when the dialog opens
 * (never in server HTML, where every visitor would share it) and reloaded after every attempt,
 * because each question accepts one answer.
 */
export function useCaptcha(active: boolean) {
  const [state, setState] = useState<CaptchaState>({ token: "", question: "", failed: false });
  const reload = useCallback(async () => {
    try {
      const challenge = await fetchCaptcha();
      setState({ token: challenge.token, question: challenge.question, failed: false });
    } catch (error) {
      console.error("GCC calculator: the security question could not be loaded", error);
      setState({ token: "", question: "", failed: true });
    }
  }, []);
  useEffect(() => {
    if (active) {
      reload().catch((error: unknown) => console.error(error));
    }
  }, [active, reload]);
  return { ...state, reload };
}
