import { useCallback, useEffect, useState } from "react";
import { fetchCaptcha } from "../../forms/shared/postFormSubmission";
import { JOB_APPLICATION_FORM_TYPE } from "../../../lib/career/application";
import type { ApplicationStatus, JobApplicationRole } from "./job-application.types";

const LOADING_QUESTION = "Loading…";
const CAPTCHA_WRONG = "That answer was not right. Please try the new question.";
const CAPTCHA_FAILED = "The security question could not be loaded. Please refresh it.";

/** The file as a base64 data URL — the form posts JSON, like every other site form. */
const readAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("The file could not be read"));
    reader.readAsDataURL(file);
  });

type Outcome = "sent" | "captcha" | "resume";

/** Posts one application; resolves what happened, throws on any other failure. */
async function postApplication(body: Record<string, unknown>): Promise<Outcome> {
  const res = await fetch("/api/job-application", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.ok) return "sent";
  const reply = (await res.json().catch(() => ({}))) as { error?: string };
  if (res.status === 400 && (reply.error === "captcha" || reply.error === "resume")) {
    return reply.error;
  }
  throw new Error(`The application failed with status ${res.status}`);
}

/**
 * The security question and the send step for the job application: same contract as the
 * other site forms (fields + captcha token/answer), plus the résumé as `resume`. Every send,
 * right or wrong, draws a new question.
 */
export function useApplicationSubmit(role: JobApplicationRole, onResumeRefused: () => void) {
  const [captcha, setCaptcha] = useState({ token: "", question: LOADING_QUESTION });
  const [captchaError, setCaptchaError] = useState("");
  const [status, setStatus] = useState<ApplicationStatus>("idle");

  const loadCaptcha = useCallback(async () => {
    try {
      setCaptcha(await fetchCaptcha());
    } catch (error) {
      console.error("The security question could not be loaded", error);
      setCaptchaError(CAPTCHA_FAILED);
    }
  }, []);

  useEffect(() => {
    loadCaptcha().catch((error: unknown) => console.error(error));
  }, [loadCaptcha]);

  const refreshCaptcha = () => {
    setCaptchaError("");
    loadCaptcha().catch((error: unknown) => console.error(error));
  };

  const submit = async (answer: string, fields: Record<string, string>, file: File) => {
    setCaptchaError("");
    setStatus("idle");
    try {
      const outcome = await postApplication({
        formType: JOB_APPLICATION_FORM_TYPE,
        ...role,
        ...fields,
        resumeName: file.name,
        resume: { name: file.name, data: await readAsDataUrl(file) },
        captchaToken: captcha.token,
        captchaAnswer: answer,
      });
      if (outcome === "captcha") setCaptchaError(CAPTCHA_WRONG);
      if (outcome === "resume") onResumeRefused();
      if (outcome === "sent") setStatus("sent");
    } catch (error) {
      console.error("The job application could not be sent", error);
      setStatus("failed");
    }
    await loadCaptcha();
  };

  return { captcha, captchaError, refreshCaptcha, status, submit };
}
