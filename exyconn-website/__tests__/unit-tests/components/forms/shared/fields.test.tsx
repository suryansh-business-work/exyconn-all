// @vitest-environment jsdom
/** The shared field parts: label + error wrapper, send button, banner, icon and their classes. */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  FormField,
  SUBMIT_COPY,
  SubmitButton,
  SubmitStatusAlert,
  SvgIcon,
  inputClassName,
} from "../../../../../src/components/forms/shared";
import {
  ERROR_CLASSES,
  LABEL_CLASSES,
} from "../../../../../src/components/forms/shared/fieldClasses";

describe("inputClassName", () => {
  it("wears the page's accent at rest", () => {
    expect(inputClassName("blue")).toContain("focus:border-blue ");
    expect(inputClassName("amber")).toContain("focus:border-amber ");
    expect(inputClassName("blue", false)).toBe(inputClassName("blue"));
  });

  it("turns red, whatever the accent, while the field holds an error", () => {
    expect(inputClassName("blue", true)).toContain("border-red-muted");
    expect(inputClassName("amber", true)).toBe(inputClassName("blue", true));
  });
});

describe("FormField", () => {
  it("labels its control and shows no error until it has one", () => {
    render(
      <FormField id="name" label="Full name">
        <input id="name" />
      </FormField>
    );
    expect(screen.getByLabelText("Full name")).toHaveAttribute("id", "name");
    expect(screen.getByText("Full name")).toHaveClass(LABEL_CLASSES);
    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("marks a required field with an asterisk", () => {
    render(
      <FormField id="email" label="Email" marker="required">
        <input id="email" />
      </FormField>
    );
    expect(screen.getByText("*")).toHaveClass("text-red-fg");
  });

  it("marks an optional field, in the form's own words when given", () => {
    const { rerender } = render(
      <FormField id="phone" label="Phone" marker="optional">
        <input id="phone" />
      </FormField>
    );
    expect(screen.getByText("(optional)")).toBeInTheDocument();
    rerender(
      <FormField id="phone" label="Phone" marker="optional" optionalLabel="(वैकल्पिक)">
        <input id="phone" />
      </FormField>
    );
    expect(screen.getByText("(वैकल्पिक)")).toBeInTheDocument();
  });

  it("shows the control's error", () => {
    render(
      <FormField id="name" label="Name" error="Too short!">
        <input id="name" />
      </FormField>
    );
    expect(screen.getByText("Too short!")).toHaveClass(ERROR_CLASSES);
  });
});

describe("SubmitButton", () => {
  it("shows its label and sends when idle", () => {
    render(<SubmitButton isSubmitting={false} className="btn" label="Send" busyLabel="Sending…" />);
    const button = screen.getByRole("button", { name: "Send" });
    expect(button).toHaveAttribute("type", "submit");
    expect(button).toBeEnabled();
    expect(button).toHaveClass("btn");
  });

  it("locks with the busy label while sending", () => {
    render(<SubmitButton isSubmitting className="btn" label="Send" busyLabel="Sending…" />);
    const button = screen.getByRole("button", { name: "Sending…" });
    expect(button).toBeDisabled();
    expect(button.querySelector(".animate-spin")).not.toBeNull();
  });
});

describe("SubmitStatusAlert", () => {
  it("shows nothing while idle", () => {
    const { container } = render(<SubmitStatusAlert status="idle" successMessage="Thanks" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("announces the thank-you", () => {
    render(<SubmitStatusAlert status="success" successMessage="Thanks!" />);
    expect(screen.getByRole("status")).toHaveTextContent("Thanks!");
  });

  it("raises the shared failure notice, or the form's own", () => {
    const { rerender } = render(<SubmitStatusAlert status="error" successMessage="Thanks" />);
    expect(screen.getByRole("alert")).toHaveTextContent(SUBMIT_COPY.failed);
    rerender(<SubmitStatusAlert status="error" successMessage="Thanks" errorMessage="Failed!" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Failed!");
  });
});

describe("SvgIcon", () => {
  it("draws a decorative icon from the site set", () => {
    const { container } = render(<SvgIcon name="send" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("class", "svg-icon");
    expect(svg?.querySelectorAll("path").length).toBeGreaterThan(0);
  });

  it("adds the caller's classes", () => {
    const { container } = render(<SvgIcon name="shield" className="icon-md" />);
    expect(container.querySelector("svg")).toHaveAttribute("class", "svg-icon icon-md");
  });
});
