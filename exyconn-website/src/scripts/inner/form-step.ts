/**
 * MultiStepFormShell progress. The form (React or plain) announces its step with
 * `announceFormStep(index)`; the shell updates its bar and its "Step x of n" text.
 */
export const FORM_STEP_EVENT = "inner:form-step";

export interface FormStepDetail {
  /** Zero-based step now showing. */
  index: number;
}

export const announceFormStep = (index: number): void => {
  document.dispatchEvent(new CustomEvent<FormStepDetail>(FORM_STEP_EVENT, { detail: { index } }));
};

export const stepText = (template: string, index: number, total: number): string =>
  template
    .replaceAll("{current}", String(Math.min(total, Math.max(1, index + 1))))
    .replaceAll("{total}", String(total));

export const stepState = (step: number, current: number): "done" | "current" | "todo" => {
  if (step < current) {
    return "done";
  }
  return step === current ? "current" : "todo";
};

const apply = (shell: HTMLElement, index: number) => {
  const steps = [...shell.querySelectorAll<HTMLElement>("[data-form-step]")];
  steps.forEach((step, i) => {
    const state = stepState(i, index);
    step.dataset.state = state;
    if (state === "current") {
      step.setAttribute("aria-current", "step");
    } else {
      step.removeAttribute("aria-current");
    }
  });
  const label = shell.querySelector<HTMLElement>("[data-form-step-text]");
  if (label) {
    label.textContent = stepText(label.dataset.formStepText as string, index, steps.length);
  }
};

export const bootFormSteps = (): void => {
  document.addEventListener(FORM_STEP_EVENT, (event) => {
    const { index } = (event as CustomEvent<FormStepDetail>).detail;
    document
      .querySelectorAll<HTMLElement>("[data-multistep]")
      .forEach((shell) => apply(shell, index));
  });
};
