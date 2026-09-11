import type { UseFormRegisterReturn } from "react-hook-form";
import { type Accent, ERROR_CLASSES, LABEL_CLASSES, inputClassName } from "./fieldClasses";

const ACCENT_CLASSES: Record<Accent, { icon: string; refresh: string }> = {
  blue: {
    icon: "fa-solid fa-shield-halved text-blue-fg",
    refresh: "p-2 text-fg-subtle hover:text-blue-fg transition-colors",
  },
  amber: {
    icon: "fa-solid fa-shield-halved text-amber-fg",
    refresh: "p-2 text-fg-subtle hover:text-amber-fg transition-colors",
  },
};

interface CaptchaFieldProps {
  question: string;
  registration: UseFormRegisterReturn;
  /** The schema's error for the answer, e.g. when it was left blank. */
  error?: string;
  /** Set when the answer was wrong on submit. */
  captchaError: string;
  onRefresh: () => void;
  accent: Accent;
}

/** The "Security Check" block: the maths question, the answer box and a new-question button. */
export function CaptchaField({
  question,
  registration,
  error,
  captchaError,
  onRefresh,
  accent,
}: Readonly<CaptchaFieldProps>) {
  const invalid = Boolean(error) || Boolean(captchaError);
  return (
    <div className="bg-surface-subtle rounded-xl p-4 border border-line">
      <label className={LABEL_CLASSES} htmlFor="captcha">
        Security Check <span className="text-red-fg">*</span>
      </label>
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 bg-surface px-4 py-2 rounded-lg border border-line">
          <i className={ACCENT_CLASSES[accent].icon}></i>
          <span className="font-mono font-bold text-fg">{question}</span>
        </div>
        <input
          type="text"
          id="captcha"
          placeholder="Answer"
          className={`w-24 ${inputClassName(accent, invalid)}`}
          {...registration}
        />
        <button
          type="button"
          onClick={onRefresh}
          className={ACCENT_CLASSES[accent].refresh}
          title="Refresh captcha"
        >
          <i className="fa-solid fa-rotate"></i>
        </button>
      </div>
      {error && <div className={ERROR_CLASSES}>{error}</div>}
      {captchaError && <div className={ERROR_CLASSES}>{captchaError}</div>}
    </div>
  );
}
