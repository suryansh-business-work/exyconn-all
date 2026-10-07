// @vitest-environment jsdom
/** The "Security Check" block and the field rules every website form shares. */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  CAPTCHA_COPY,
  CaptchaField,
  captchaAnswer,
  optionalMatch,
  requiredEmail,
} from "../../../../../src/components/forms/shared";

const registration = {
  name: "captcha",
  onChange: vi.fn(async () => true),
  onBlur: vi.fn(async () => true),
  ref: vi.fn(),
};

function setup(props: Partial<Parameters<typeof CaptchaField>[0]> = {}) {
  const onRefresh = vi.fn();
  render(
    <CaptchaField
      question="3 + 4 = ?"
      registration={registration}
      captchaError=""
      onRefresh={onRefresh}
      accent="blue"
      {...props}
    />
  );
  return { onRefresh, input: screen.getByLabelText(/^Security Check/) };
}

describe("CaptchaField", () => {
  it("shows the question, the answer box and its hint in the shared words", () => {
    const { input } = setup();
    expect(screen.getByText("3 + 4 = ?")).toHaveAttribute("aria-live", "polite");
    expect(input).toHaveAttribute("placeholder", CAPTCHA_COPY.placeholder);
    expect(input).toHaveAttribute("aria-describedby", "captcha-question captcha-hint");
    expect(input).toHaveAttribute("aria-invalid", "false");
    expect(input).toHaveAttribute("name", "captcha");
    expect(screen.getByText(CAPTCHA_COPY.hint)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("passes typing to the form's registration", () => {
    const { input } = setup();
    fireEvent.change(input, { target: { value: "7" } });
    expect(registration.onChange).toHaveBeenCalled();
  });

  it("draws a new question on request", () => {
    const { onRefresh } = setup();
    fireEvent.click(screen.getByRole("button", { name: CAPTCHA_COPY.refreshLabel }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("shows the schema's error", () => {
    const { input } = setup({ error: "Please solve the captcha" });
    expect(screen.getByRole("alert")).toHaveTextContent("Please solve the captcha");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("shows a wrong answer, in the amber accent too", () => {
    const { input } = setup({ captchaError: "Wrong answer", accent: "amber" });
    expect(screen.getByRole("alert")).toHaveTextContent("Wrong answer");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("button", { name: CAPTCHA_COPY.refreshLabel })).toHaveClass(
      "hover:text-amber-fg"
    );
  });

  it("uses the page's own words when given", () => {
    render(
      <CaptchaField
        question="2 + 2 = ?"
        registration={registration}
        captchaError=""
        onRefresh={vi.fn()}
        accent="blue"
        copy={{
          label: "सुरक्षा जांच",
          placeholder: "उत्तर",
          hint: "योग का उत्तर लिखें",
          refreshTitle: "नया प्रश्न",
          refreshLabel: "नया सुरक्षा प्रश्न दिखाएं",
        }}
      />
    );
    expect(screen.getByLabelText(/^सुरक्षा जांच/)).toHaveAttribute("placeholder", "उत्तर");
    expect(screen.getByText("योग का उत्तर लिखें")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "नया सुरक्षा प्रश्न दिखाएं" })).toHaveAttribute(
      "title",
      "नया प्रश्न"
    );
  });
});

describe("field rules", () => {
  it("requires a valid email, trimmed", () => {
    const email = requiredEmail();
    expect(email.parse("  a@b.co ")).toBe("a@b.co");
    expect(email.safeParse("").error?.issues[0]?.message).toBe("Email is required");
    expect(email.safeParse("not-an-email").error?.issues[0]?.message).toBe("Invalid email address");
    expect(requiredEmail("Need it", "Bad").safeParse("x@").error?.issues[0]?.message).toBe("Bad");
  });

  it("requires a captcha answer", () => {
    expect(captchaAnswer().safeParse("").error?.issues[0]?.message).toBe(
      "Please solve the captcha"
    );
    expect(captchaAnswer("Answer it").safeParse("").error?.issues[0]?.message).toBe("Answer it");
    expect(captchaAnswer().parse("7")).toBe("7");
  });

  it("allows a blank optional field but checks it once filled", () => {
    const code = optionalMatch(/^\d{3}$/, "Three digits");
    expect(code.parse("")).toBe("");
    expect(code.parse(" 123 ")).toBe("123");
    expect(code.safeParse("12a").error?.issues[0]?.message).toBe("Three digits");
  });
});
