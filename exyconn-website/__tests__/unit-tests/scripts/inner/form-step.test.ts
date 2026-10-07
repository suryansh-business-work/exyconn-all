// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  announceFormStep,
  bootFormSteps,
  FORM_STEP_EVENT,
  type FormStepDetail,
} from "../../../../src/scripts/inner/form-step";
import { trackDocumentListeners } from "../script-dom";

const steps = (count: number) =>
  Array.from({ length: count }, (_, i) => `<li data-form-step>Step ${i + 1}</li>`).join("");

const MARKUP = `
  <div id="apply" data-multistep>
    <ol>${steps(3)}</ol>
    <p data-form-step-text="Step {current} of {total}"></p>
  </div>
  <div id="quote" data-multistep><ol>${steps(2)}</ol></div>
`;

let releaseListeners: () => void;
const stateOf = (shell: string) =>
  [...document.querySelectorAll<HTMLElement>(`#${shell} [data-form-step]`)].map(
    (step) => step.dataset.state
  );
const currentOf = (shell: string) =>
  [...document.querySelectorAll(`#${shell} [data-form-step]`)].map((step) =>
    step.getAttribute("aria-current")
  );
const label = () => document.querySelector("[data-form-step-text]")?.textContent;

beforeEach(() => {
  releaseListeners = trackDocumentListeners();
  document.body.innerHTML = MARKUP;
});

afterEach(() => {
  releaseListeners();
  document.body.innerHTML = "";
});

describe("announceFormStep", () => {
  it("tells the document which step is showing", () => {
    const heard = vi.fn((event: Event) => (event as CustomEvent<FormStepDetail>).detail);
    document.addEventListener(FORM_STEP_EVENT, heard);
    announceFormStep(2);
    expect(heard.mock.results[0].value).toEqual({ index: 2 });
  });
});

describe("bootFormSteps", () => {
  it("marks steps done, current and to do, and phrases the progress", () => {
    bootFormSteps();
    announceFormStep(1);
    expect(stateOf("apply")).toEqual(["done", "current", "todo"]);
    expect(currentOf("apply")).toEqual([null, "step", null]);
    expect(label()).toBe("Step 2 of 3");
  });

  it("moves the current step as the form advances", () => {
    bootFormSteps();
    announceFormStep(0);
    expect(currentOf("apply")).toEqual(["step", null, null]);
    announceFormStep(2);
    expect(currentOf("apply")).toEqual([null, null, "step"]);
    expect(label()).toBe("Step 3 of 3");
  });

  it("updates every shell on the page, with or without a progress label", () => {
    bootFormSteps();
    announceFormStep(1);
    expect(stateOf("quote")).toEqual(["done", "current"]);
  });

  it("keeps the label within the steps there are", () => {
    bootFormSteps();
    announceFormStep(5);
    expect(stateOf("apply")).toEqual(["done", "done", "done"]);
    expect(label()).toBe("Step 3 of 3");
  });

  it("reads an empty label template as no text", () => {
    document.querySelector("[data-form-step-text]")?.setAttribute("data-form-step-text", "");
    bootFormSteps();
    announceFormStep(0);
    expect(label()).toBe("");
  });
});
