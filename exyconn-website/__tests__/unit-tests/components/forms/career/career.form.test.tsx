// @vitest-environment jsdom
/** The career form: validation, the résumé picker and the send step. */
import { fireEvent, screen, waitFor } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CareerFormReact, resumeError } from "../../../../../src/components/forms/career";
import { renderWithUser } from "../../../test-utils";
import { postedTo, reply, serveSite } from "../forms.helpers";

const field = (label: RegExp) => screen.getByLabelText(label);
const submit = () => screen.getByRole("button", { name: "Submit Application" });
const pdf = (name = "cv.pdf") => new File(["%PDF-1.7"], name, { type: "application/pdf" });
const pick = (files: File[]) => fireEvent.change(field(/^Resume/), { target: { files } });

async function setup(post = () => reply(200)) {
  const fetchMock = serveSite(post);
  const view = renderWithUser(<CareerFormReact />);
  await screen.findByText("1 + 1 = ?");
  return { ...view, fetchMock };
}

async function fillValid(user: UserEvent) {
  await user.type(field(/^Full Name/), "Meera Iyer");
  await user.type(field(/^Email/), "meera@example.com");
  await user.type(field(/^Phone/), "+91 98765 43210");
  await user.type(field(/^Position Applied For/), "EXY-2026-001");
  await user.type(field(/^Cover Letter/), "Keen to join.");
  await user.type(field(/^Security Check/), "2");
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("resumeError", () => {
  it("accepts PDF and Word files up to 5 MB", () => {
    expect(resumeError(pdf())).toBe("");
    const docx = new File(["x"], "cv.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    expect(resumeError(docx)).toBe("");
    expect(resumeError(new File(["x"], "cv.doc", { type: "application/msword" }))).toBe("");
  });

  it("refuses other types and files over 5 MB", () => {
    expect(resumeError(new File(["x"], "a.png", { type: "image/png" }))).toBe(
      "Only PDF, DOC, and DOCX files are allowed"
    );
    const big = pdf();
    Object.defineProperty(big, "size", { value: 5 * 1024 * 1024 + 1 });
    expect(resumeError(big)).toBe("File size must be less than 5MB");
  });
});

describe("CareerFormReact", () => {
  it("shows the required messages, and asks for a résumé, when submitted empty", async () => {
    const { user, fetchMock } = await setup();
    await user.click(submit());
    expect(await screen.findByText("Full name is required")).toBeInTheDocument();
    expect(screen.getByText("Email is required")).toBeInTheDocument();
    expect(screen.getByText("Job ID is required")).toBeInTheDocument();
    expect(screen.getByText("Please solve the captcha")).toBeInTheDocument();
    expect(postedTo(fetchMock)).toEqual([]);
  });

  it("asks for a résumé once the fields are valid", async () => {
    const { user, fetchMock } = await setup();
    await fillValid(user);
    await user.click(submit());
    expect(await screen.findByText("Please upload your resume")).toBeInTheDocument();
    expect(postedTo(fetchMock)).toEqual([]);
  });

  it("checks the phone once one is typed", async () => {
    const { user } = await setup();
    await user.type(field(/^Phone/), "call me");
    await user.click(submit());
    expect(await screen.findByText("Invalid phone number")).toBeInTheDocument();
  });

  it("refuses a résumé of the wrong type and ignores a cancelled picker", async () => {
    await setup();
    pick([new File(["x"], "photo.png", { type: "image/png" })]);
    expect(
      await screen.findByText("Only PDF, DOC, and DOCX files are allowed")
    ).toBeInTheDocument();
    pick([]);
    expect(screen.getByText("Only PDF, DOC, and DOCX files are allowed")).toBeInTheDocument();
    expect(screen.queryByText("photo.png")).not.toBeInTheDocument();
  });

  it("sends the fields with the résumé's name, thanks the visitor and clears the form", async () => {
    const { user, fetchMock } = await setup();
    await fillValid(user);
    pick([pdf("meera-cv.pdf")]);
    expect(await screen.findByText("meera-cv.pdf")).toBeInTheDocument();
    await user.click(submit());
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Thank you! Your application has been submitted successfully."
    );
    expect(postedTo(fetchMock)).toEqual([
      {
        formType: "career",
        name: "Meera Iyer",
        email: "meera@example.com",
        phone: "+91 98765 43210",
        jobId: "EXY-2026-001",
        message: "Keen to join.",
        resumeName: "meera-cv.pdf",
        captchaToken: "token-1",
        captchaAnswer: "2",
      },
    ]);
    await waitFor(() => expect(field(/^Full Name/)).toHaveValue(""));
    expect(screen.queryByText("meera-cv.pdf")).not.toBeInTheDocument();
  });

  it("raises the failure notice when the send fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { user } = await setup(() => reply(500));
    await fillValid(user);
    pick([pdf()]);
    await user.click(submit());
    expect(await screen.findByText("Something went wrong. Please try again.")).toBeInTheDocument();
  });
});
