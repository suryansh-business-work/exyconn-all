// @vitest-environment jsdom
/** The job application form's send: success panel, refused captcha or résumé, failures. */
import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { JobApplicationForm } from "../../../../../src/components/career/job-application";
import { renderWithUser } from "../../../test-utils";
import {
  attachResume,
  COVER_LETTER,
  fillRequired,
  postedBodies,
  ROLE,
  servePortal,
  submitButton,
} from "./job-application.helpers";

async function renderAndFill(post: () => Response) {
  const fetchMock = servePortal(post);
  const view = renderWithUser(<JobApplicationForm {...ROLE} />);
  await screen.findByText("1 + 1 = ?");
  await fillRequired(view.user);
  await attachResume(view.user);
  return { ...view, fetchMock };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("JobApplicationForm send", () => {
  it("sends the application and replaces the form with the success panel", async () => {
    const { user, fetchMock } = await renderAndFill(() => new Response(null, { status: 201 }));
    await user.click(submitButton());
    const panel = await screen.findByRole("status");
    expect(panel).toHaveTextContent("Application sent");
    expect(panel).toHaveTextContent(
      "Thank you for applying to Platform Engineer at Acme. We will get back to you within 48 hours."
    );
    expect(screen.getByRole("link", { name: "More roles at Acme" })).toHaveAttribute(
      "href",
      "/career/company/acme"
    );
    expect(screen.queryByRole("form")).not.toBeInTheDocument();

    const [body] = postedBodies(fetchMock);
    expect(body).toMatchObject({
      formType: "job-application",
      ...ROLE,
      firstName: "Meera",
      lastName: "Iyer",
      email: "meera@example.com",
      phone: "+91 98765 43210",
      location: "Pune",
      experience: "4-6",
      noticePeriod: "30days",
      currentCTC: "",
      expectedCTC: "24",
      linkedin: "https://linkedin.com/in/meera",
      portfolio: "",
      coverLetter: COVER_LETTER,
      referral: "",
      resumeName: "meera-cv.pdf",
      captchaToken: "token-1",
      captchaAnswer: "2",
    });
    expect(body).not.toHaveProperty("consent");
    expect(body).not.toHaveProperty("captcha");
    expect(body.resume).toMatchObject({ name: "meera-cv.pdf" });
  });

  it("sends the chosen referral source", async () => {
    const { user, fetchMock } = await renderAndFill(() => new Response(null, { status: 201 }));
    await user.selectOptions(screen.getByLabelText(/^How did you hear/), "naukri");
    await user.click(submitButton());
    await screen.findByRole("status");
    expect(postedBodies(fetchMock)[0]).toMatchObject({ referral: "naukri" });
  });

  it("shows a new question when the captcha answer was wrong", async () => {
    const { user } = await renderAndFill(() =>
      Response.json({ error: "captcha" }, { status: 400 })
    );
    await user.click(submitButton());
    expect(
      await screen.findByText("That answer was not right. Please try the new question.")
    ).toBeInTheDocument();
    expect(await screen.findByText("2 + 1 = ?")).toBeInTheDocument();
    expect(screen.getByRole("form", { name: "Job application" })).toBeInTheDocument();
  });

  it("asks for another file when the portal refuses the résumé", async () => {
    const { user } = await renderAndFill(() => Response.json({ error: "resume" }, { status: 400 }));
    await user.click(submitButton());
    expect(
      await screen.findByText(
        "That file could not be accepted. Please attach a PDF, DOC or DOCX of up to 5 MB."
      )
    ).toHaveAttribute("role", "alert");
  });

  it("reports a send that failed and keeps what was typed", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { user } = await renderAndFill(() => new Response("down", { status: 502 }));
    await user.click(submitButton());
    expect(
      await screen.findByText(
        "Your application could not be sent. Please check your connection and try again."
      )
    ).toHaveAttribute("role", "alert");
    expect(screen.getByLabelText(/^First name/)).toHaveValue("Meera");
    expect(log).toHaveBeenCalledWith("The job application could not be sent", expect.any(Error));
  });

  it("draws a new security question on request", async () => {
    const fetchMock = servePortal(() => new Response(null, { status: 201 }));
    const { user } = renderWithUser(<JobApplicationForm {...ROLE} />);
    await screen.findByText("1 + 1 = ?");
    await user.click(screen.getByRole("button", { name: "Show a new security question" }));
    expect(await screen.findByText("2 + 1 = ?")).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });
});
