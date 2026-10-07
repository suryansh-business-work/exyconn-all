/**
 * Shared steps for the job application form tests: a fake portal behind `fetch`, the role
 * the form applies for, and filling every required field the way a visitor would.
 */
import { screen } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import { vi } from "vitest";

export const ROLE = {
  jobId: "job-42",
  jobTitle: "Platform Engineer",
  companyName: "Acme",
  companySlug: "acme",
};

export const COVER_LETTER = "I have shipped three portals and want to build the next one with you.";

/** `fetch` serving numbered questions from /api/captcha and `post` for the application. */
export function servePortal(post: () => Response) {
  let questions = 0;
  const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(async (url) => {
    if (url === "/api/captcha") {
      questions += 1;
      return Response.json({ token: `token-${questions}`, question: `${questions} + 1 = ?` });
    }
    return post();
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

/** The application requests `fetch` received, parsed. */
export function postedBodies(fetchMock: ReturnType<typeof servePortal>) {
  return fetchMock.mock.calls
    .filter(([url]) => url === "/api/job-application")
    .map(([, init]) => JSON.parse(String(init?.body)) as Record<string, unknown>);
}

export const field = (label: RegExp) => screen.getByLabelText(label);

/** Fills every required field (and one optional link) with valid answers. */
export async function fillRequired(user: UserEvent) {
  await user.type(field(/^First name/), "Meera");
  await user.type(field(/^Last name/), "Iyer");
  await user.type(field(/^Email address/), "meera@example.com");
  await user.type(field(/^Phone number/), "+91 98765 43210");
  await user.type(field(/^Current location/), "Pune");
  await user.selectOptions(field(/^Years of experience/), "4-6");
  await user.selectOptions(field(/^Notice period/), "30days");
  await user.type(field(/^Expected CTC/), "24");
  await user.type(field(/^LinkedIn profile/), "https://linkedin.com/in/meera");
  await user.click(field(/^Why do you want to join Acme\?/));
  await user.paste(COVER_LETTER);
  await user.click(field(/^I agree to the processing/));
  await user.type(field(/^Security Check/), "2");
}

export async function attachResume(user: UserEvent) {
  const file = new File(["%PDF-1.7"], "meera-cv.pdf", { type: "application/pdf" });
  await user.upload(field(/^Résumé \/ CV/), file);
  return file;
}

export const submitButton = () => screen.getByRole("button", { name: "Submit application" });
