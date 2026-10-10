// @vitest-environment jsdom
/** The job application form's validation: required fields, formats and the résumé. */
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { JobApplicationForm } from "../../../../../src/components/career/job-application";
import { renderWithUser } from "../../../test-utils";
import {
  attachResume,
  field,
  fillRequired,
  postedBodies,
  ROLE,
  servePortal,
  submitButton,
} from "./job-application.helpers";

const NO_RESUME = "Please attach your résumé";

async function renderForm() {
  const fetchMock = servePortal(() => new Response(null, { status: 201 }));
  const view = renderWithUser(<JobApplicationForm {...ROLE} />);
  await screen.findByText("1 + 1 = ?");
  return { ...view, fetchMock };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("JobApplicationForm validation", () => {
  it("names the form and lists the role's company in the cover letter question", async () => {
    await renderForm();
    expect(screen.getByRole("form", { name: "Job application" })).toBeInTheDocument();
    expect(field(/^Why do you want to join Acme\?/)).toHaveAttribute("rows", "5");
    expect(field(/^Years of experience/)).toHaveDisplayValue("Select");
    expect(screen.getByRole("option", { name: "10+ years" })).toBeInTheDocument();
  });

  it("reports every missing required field, the résumé included, and sends nothing", async () => {
    const { user, fetchMock } = await renderForm();
    await user.click(submitButton());
    expect(await screen.findByText("First name is required")).toBeInTheDocument();
    for (const message of [
      "Last name is required",
      "Email is required",
      "Phone number is required",
      "Location is required",
      "Select your experience",
      "Select your notice period",
      "Expected CTC is required",
      "Tell us why you want to join",
      "Please solve the captcha",
      NO_RESUME,
    ]) {
      expect(screen.getByText(message)).toBeInTheDocument();
    }
    const consentError = screen.getByText("Please agree to continue");
    expect(consentError).toHaveAttribute("role", "alert");
    expect(field(/^I agree to the processing/)).toHaveAttribute(
      "aria-describedby",
      consentError.id
    );
    expect(field(/^First name/)).toHaveAttribute("aria-invalid", "true");
    expect(field(/^Why do you want to join/)).toHaveAttribute("aria-invalid", "true");
    expect(field(/^Years of experience/)).toHaveAttribute("aria-invalid", "true");
    expect(field(/^Current CTC/)).toHaveAttribute("aria-invalid", "false");
    expect(postedBodies(fetchMock)).toHaveLength(0);
  });

  it("checks formats once a field has been left", async () => {
    const { user } = await renderForm();
    await user.type(field(/^Expected CTC/), "lots");
    await user.type(field(/^Current CTC/), "plenty");
    await user.type(field(/^LinkedIn profile/), "linkedin.com/in/meera");
    await user.type(field(/^Portfolio/), "x");
    expect(await screen.findAllByText("Enter a number, e.g. 12 or 12.5")).toHaveLength(2);
    expect(screen.getByText("Enter a full link starting with https://")).toBeInTheDocument();
    await user.click(field(/^Why do you want to join/));
    await user.paste("Too short");
    await user.tab();
    expect(
      await screen.findByText("A little more, please — at least 20 characters")
    ).toBeInTheDocument();
    expect(screen.getAllByText("Enter a full link starting with https://")).toHaveLength(2);
  });

  it("refuses a referral source that is not one of the options offered", async () => {
    const { user } = await renderForm();
    const referral = field(/^How did you hear about this position/);
    referral.append(new Option("Not offered", "not-offered"));
    await user.selectOptions(referral, "not-offered");
    await user.tab();
    expect(await screen.findByText("Select an option")).toBeInTheDocument();
  });

  it("asks for the résumé when everything else is valid", async () => {
    const { user, fetchMock } = await renderForm();
    await fillRequired(user);
    await user.click(submitButton());
    expect(await screen.findByText(NO_RESUME)).toHaveAttribute("role", "alert");
    expect(postedBodies(fetchMock)).toHaveLength(0);
  });

  it("does not blame an attached résumé when other fields are invalid", async () => {
    const { user, fetchMock } = await renderForm();
    await attachResume(user);
    expect(screen.getByText("meera-cv.pdf")).toBeInTheDocument();
    expect(screen.getByText("Change file")).toBeInTheDocument();
    await user.click(submitButton());
    expect(await screen.findByText("First name is required")).toBeInTheDocument();
    expect(screen.queryByText(NO_RESUME)).not.toBeInTheDocument();
    expect(postedBodies(fetchMock)).toHaveLength(0);
  });

  it("refuses a picked file of the wrong type, then takes a PDF in its place", async () => {
    const { user } = await renderForm();
    // The picker's `accept` would filter the PNG out; a visitor can still choose "All files".
    // Uploading through user-event keeps input.files a real FileList for the next upload.
    await userEvent
      .setup({ applyAccept: false })
      .upload(field(/^Résumé \/ CV/), new File(["x"], "photo.png", { type: "image/png" }));
    expect(
      await screen.findByText("Only PDF, DOC, and DOCX files are allowed")
    ).toBeInTheDocument();
    expect(screen.getByText("No file chosen")).toBeInTheDocument();
    await attachResume(user);
    expect(screen.queryByText("Only PDF, DOC, and DOCX files are allowed")).not.toBeInTheDocument();
    expect(screen.getByText("meera-cv.pdf")).toBeInTheDocument();
  });
});
