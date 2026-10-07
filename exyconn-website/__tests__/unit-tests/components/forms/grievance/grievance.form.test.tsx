// @vitest-environment jsdom
/** The grievance page form: validation, the send step and its outcomes. */
import { screen, waitFor } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  type GrievanceFormCopy,
  GrievanceFormReact,
} from "../../../../../src/components/forms/grievance";
import { CAPTCHA_COPY } from "../../../../../src/components/forms/shared";
import { renderWithUser } from "../../../test-utils";
import { postedTo, reply, serveSite } from "../forms.helpers";

const COPY: GrievanceFormCopy = {
  formLabel: "Grievance form",
  success: "Your grievance was received.",
  fields: {
    name: { label: "Name", placeholder: "Your name" },
    email: { label: "Email", placeholder: "you@example.com" },
    subject: { label: "Subject", placeholder: "In short" },
    message: { label: "Details", placeholder: "What happened?" },
  },
  submit: "Submit grievance",
  sending: "Submitting…",
  finePrint: "We reply within 15 days.",
  captcha: CAPTCHA_COPY,
  status: {
    loading: "Loading…",
    loadFailed: "Load failed",
    incorrect: "Wrong answer",
    failed: "Send failed",
  },
  messages: {
    nameRequired: "Name is required",
    tooShort: "Too short",
    tooLong: "Too long",
    emailRequired: "Email is required",
    emailInvalid: "Email is invalid",
    subjectRequired: "Subject is required",
    subjectTooShort: "Subject is too short",
    subjectTooLong: "Subject is too long",
    messageRequired: "Details are required",
    messageTooShort: "Details are too short",
    messageTooLong: "Details are too long",
    captchaRequired: "Solve the sum",
  },
};

const DETAILS = "The invoice I received lists the wrong amount.";
const field = (label: RegExp) => screen.getByLabelText(label);
const submit = () => screen.getByRole("button", { name: "Submit grievance" });

async function setup(post = () => reply(200)) {
  const fetchMock = serveSite(post);
  const view = renderWithUser(<GrievanceFormReact copy={COPY} />);
  await screen.findByText("1 + 1 = ?");
  return { ...view, fetchMock };
}

async function fillValid(user: UserEvent) {
  await user.type(field(/^Name/), "Ravi Kumar");
  await user.type(field(/^Email/), "ravi@example.com");
  await user.type(field(/^Subject/), "Wrong invoice");
  await user.click(field(/^Details/));
  await user.paste(DETAILS);
  await user.type(field(/^Security Check/), "2");
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("GrievanceFormReact", () => {
  it("renders the page's words, fine print included", async () => {
    await setup();
    expect(screen.getByRole("form", { name: "Grievance form" })).toBeInTheDocument();
    expect(field(/^Details/)).toHaveAttribute("placeholder", "What happened?");
    expect(screen.getByText("We reply within 15 days.")).toBeInTheDocument();
  });

  it("shows every required message and sends nothing when submitted empty", async () => {
    const { user, fetchMock } = await setup();
    await user.click(submit());
    for (const message of [
      "Name is required",
      "Email is required",
      "Subject is required",
      "Details are required",
      "Solve the sum",
    ]) {
      expect(await screen.findByText(message)).toBeInTheDocument();
    }
    expect(postedTo(fetchMock)).toEqual([]);
  });

  it("checks the lengths and the email format", async () => {
    const { user } = await setup();
    await user.type(field(/^Name/), "R");
    await user.type(field(/^Email/), "ravi@");
    await user.type(field(/^Subject/), "Bill");
    await user.type(field(/^Details/), "Too brief");
    await user.click(submit());
    expect(await screen.findByText("Too short")).toBeInTheDocument();
    expect(screen.getByText("Email is invalid")).toBeInTheDocument();
    expect(screen.getByText("Subject is too short")).toBeInTheDocument();
    expect(screen.getByText("Details are too short")).toBeInTheDocument();
  });

  it("sends the grievance without the answer and clears the form", async () => {
    const { user, fetchMock } = await setup();
    await fillValid(user);
    await user.click(submit());
    expect(await screen.findByRole("status")).toHaveTextContent(COPY.success);
    expect(postedTo(fetchMock)).toEqual([
      {
        formType: "grievance",
        name: "Ravi Kumar",
        email: "ravi@example.com",
        subject: "Wrong invoice",
        message: DETAILS,
        captchaToken: "token-1",
        captchaAnswer: "2",
      },
    ]);
    await waitFor(() => expect(field(/^Name/)).toHaveValue(""));
  });

  it("asks for a new answer when the sum was wrong", async () => {
    const { user } = await setup(() => reply(400, { error: "captcha" }));
    await fillValid(user);
    await user.click(submit());
    expect(await screen.findByText("Wrong answer")).toBeInTheDocument();
    expect(await screen.findByText("2 + 1 = ?")).toBeInTheDocument();
  });

  it("shows the page's failure notice when the send fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { user } = await setup(() => reply(503));
    await fillValid(user);
    await user.click(submit());
    expect(await screen.findByRole("alert")).toHaveTextContent("Send failed");
  });
});
