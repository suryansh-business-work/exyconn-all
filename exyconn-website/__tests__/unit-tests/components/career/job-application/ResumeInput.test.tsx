// @vitest-environment jsdom
/** The résumé picker: checked as soon as a file is picked, described for screen readers. */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ResumeInput } from "../../../../../src/components/career/job-application/ResumeInput";

const COPY = {
  label: "Résumé / CV",
  hint: "PDF, DOC or DOCX, up to 5 MB",
  empty: "No file chosen",
  choose: "Choose a file",
  change: "Change file",
};

function setup(file: File | null = null, error = "") {
  const onChange = vi.fn();
  const view = render(<ResumeInput {...COPY} file={file} error={error} onChange={onChange} />);
  const input = screen.getByLabelText(/^Résumé \/ CV/) as HTMLInputElement;
  return { ...view, input, onChange };
}

const pick = (input: HTMLInputElement, files: File[]) =>
  fireEvent.change(input, { target: { files } });

describe("ResumeInput", () => {
  it("offers PDF and Word files and shows the empty state", () => {
    const { input, container } = setup();
    expect(input).toHaveAttribute("type", "file");
    expect(input).toHaveAttribute("accept", ".pdf,.doc,.docx");
    expect(input).toHaveAttribute("aria-invalid", "false");
    expect(screen.getByText(COPY.empty)).toBeInTheDocument();
    expect(screen.getByText(COPY.choose)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(container.querySelector(".job-apply__drop")).not.toHaveAttribute("data-filled");
    const hint = screen.getByText(COPY.hint);
    expect(input.getAttribute("aria-describedby")).toBe(hint.id);
  });

  it("accepts a PDF", () => {
    const { input, onChange } = setup();
    const file = new File(["%PDF"], "cv.pdf", { type: "application/pdf" });
    pick(input, [file]);
    expect(onChange).toHaveBeenCalledWith(file, "");
  });

  it("refuses a file of the wrong type", () => {
    const { input, onChange } = setup();
    pick(input, [new File(["x"], "photo.png", { type: "image/png" })]);
    expect(onChange).toHaveBeenCalledWith(null, "Only PDF, DOC, and DOCX files are allowed");
  });

  it("refuses a file over 5 MB", () => {
    const { input, onChange } = setup();
    const big = new File(["x"], "cv.pdf", { type: "application/pdf" });
    Object.defineProperty(big, "size", { value: 5 * 1024 * 1024 + 1 });
    pick(input, [big]);
    expect(onChange).toHaveBeenCalledWith(null, "File size must be less than 5MB");
  });

  it("ignores a cancelled picker", () => {
    const { input, onChange } = setup();
    pick(input, []);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("shows the picked file and its error, both described on the input", () => {
    const file = new File(["%PDF"], "meera-cv.pdf", { type: "application/pdf" });
    const { input, container } = setup(file, "Please attach your résumé");
    expect(screen.getByText("meera-cv.pdf")).toBeInTheDocument();
    expect(screen.getByText(COPY.change)).toBeInTheDocument();
    expect(container.querySelector(".job-apply__drop")).toHaveAttribute("data-filled", "");
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Please attach your résumé");
    expect(input).toHaveAttribute("aria-invalid", "true");
    const hint = screen.getByText(COPY.hint);
    expect(input.getAttribute("aria-describedby")).toBe(`${hint.id} ${alert.id}`);
  });
});
