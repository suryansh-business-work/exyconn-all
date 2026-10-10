// @vitest-environment jsdom
/** The contact page form: validation, the send step and its outcomes. */
import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ContactFormReact from "../../../../../src/components/forms/ContactFormReact";
import type { ContactFormCopy } from "../../../../../src/components/forms/contact";
import { CAPTCHA_COPY } from "../../../../../src/components/forms/shared";
import type { UserEvent } from "@testing-library/user-event";
import { renderWithUser } from "../../../test-utils";
import { postedTo, reply, serveSite } from "../forms.helpers";

const COPY: ContactFormCopy = {
  formLabel: "Contact us",
  success: "Thanks, we will reply soon.",
  fields: {
    firstName: { label: "First name", placeholder: "Ada" },
    lastName: { label: "Last name", placeholder: "Lovelace" },
    email: { label: "Email", placeholder: "you@company.com" },
    company: { label: "Company", placeholder: "Acme" },
    message: { label: "Message", placeholder: "How can we help?" },
  },
  subject: { label: "Subject", placeholder: "Choose a topic" },
  subjects: [
    { value: "sales", label: "Sales" },
    { value: "support", label: "Support" },
  ],
  submit: "Send message",
  sending: "Sending…",
  finePrint: {
    text: "By sending, you agree to our",
    linkLabel: "Privacy Policy",
    linkHref: "/privacy",
    after: ".",
  },
  captcha: CAPTCHA_COPY,
  status: {
    loading: "Loading…",
    loadFailed: "Load failed",
    incorrect: "Wrong answer",
    failed: "Send failed",
  },
  messages: {
    firstNameRequired: "First name is required",
    lastNameRequired: "Last name is required",
    tooShort: "Too short",
    tooLong: "Too long",
    emailRequired: "Email is required",
    emailInvalid: "Email is invalid",
    subjectRequired: "Pick a subject",
    messageRequired: "Message is required",
    messageTooShort: "Message is too short",
    messageTooLong: "Message is too long",
    captchaRequired: "Solve the sum",
  },
};

const field = (label: RegExp) => screen.getByLabelText(label);

async function setup(post = () => reply(200)) {
  const fetchMock = serveSite(post);
  const view = renderWithUser(<ContactFormReact copy={COPY} />);
  await screen.findByText("1 + 1 = ?");
  return { ...view, fetchMock };
}

async function fillValid(user: UserEvent) {
  await user.type(field(/^First name/), "Ada");
  await user.type(field(/^Last name/), "Lovelace");
  await user.type(field(/^Email/), "ada@example.com");
  await user.type(field(/^Company/), "Analytical");
  await user.selectOptions(field(/^Subject/), "support");
  await user.type(field(/^Message/), "Please call me back about a project.");
  await user.type(field(/^Security Check/), "2");
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("ContactFormReact", () => {
  it("renders the page's words and the security question", async () => {
    await setup();
    expect(screen.getByRole("form", { name: "Contact us" })).toBeInTheDocument();
    expect(field(/^First name/)).toHaveAttribute("placeholder", "Ada");
    expect(screen.getByRole("option", { name: "Choose a topic" })).toBeDisabled();
    expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute(
      "href",
      "/privacy"
    );
    expect(screen.getByRole("button", { name: "Send message" })).toBeEnabled();
  });

  it("shows every required message and sends nothing when submitted empty", async () => {
    const { user, fetchMock } = await setup();
    await user.click(screen.getByRole("button", { name: "Send message" }));
    for (const message of [
      "First name is required",
      "Last name is required",
      "Email is required",
      "Pick a subject",
      "Message is required",
      "Solve the sum",
    ]) {
      expect(await screen.findByText(message)).toBeInTheDocument();
    }
    expect(field(/^First name/)).toHaveAttribute("aria-invalid", "true");
    expect(postedTo(fetchMock)).toEqual([]);
  });

  it("checks lengths and the email format", async () => {
    const { user } = await setup();
    await user.type(field(/^First name/), "A");
    await user.type(field(/^Last name/), "B".repeat(51));
    await user.type(field(/^Email/), "ada@");
    await user.type(field(/^Message/), "Hi");
    await user.click(screen.getByRole("button", { name: "Send message" }));
    expect(await screen.findByText("Too short")).toBeInTheDocument();
    expect(screen.getByText("Too long")).toBeInTheDocument();
    expect(screen.getByText("Email is invalid")).toBeInTheDocument();
    expect(screen.getByText("Message is too short")).toBeInTheDocument();
  });

  it("sends the fields without the answer, thanks the visitor and clears the form", async () => {
    const { user, fetchMock } = await setup();
    await fillValid(user);
    await user.click(screen.getByRole("button", { name: "Send message" }));
    expect(await screen.findByRole("status")).toHaveTextContent(COPY.success);
    expect(postedTo(fetchMock)).toEqual([
      {
        formType: "contact",
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@example.com",
        company: "Analytical",
        subject: "support",
        message: "Please call me back about a project.",
        captchaToken: "token-1",
        captchaAnswer: "2",
      },
    ]);
    await waitFor(() => expect(field(/^First name/)).toHaveValue(""));
    expect(await screen.findByText("2 + 1 = ?")).toBeInTheDocument();
  });

  it("asks for a new answer when the sum was wrong", async () => {
    const { user } = await setup(() => reply(400, { error: "captcha" }));
    await fillValid(user);
    await user.click(screen.getByRole("button", { name: "Send message" }));
    expect(await screen.findByText("Wrong answer")).toBeInTheDocument();
    expect(field(/^First name/)).toHaveValue("Ada");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows the page's failure notice when the send fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { user } = await setup(() => reply(500));
    await fillValid(user);
    await user.click(screen.getByRole("button", { name: "Send message" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Send failed");
  });
});

describe("ContactFormReact length limits", () => {
  it("refuses a company name over 100 characters once the field is left", async () => {
    const { user, fetchMock } = await setup();
    await user.click(field(/^Company/));
    await user.paste("c".repeat(101));
    await user.tab();

    expect(await screen.findByText("Too long")).toBeInTheDocument();
    expect(field(/^Company/)).toHaveAttribute("aria-invalid", "true");
    expect(postedTo(fetchMock)).toEqual([]);
  });
});
