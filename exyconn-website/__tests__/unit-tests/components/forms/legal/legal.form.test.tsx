// @vitest-environment jsdom
/** The legal request form: validation, the send step and its outcomes. */
import { screen, waitFor } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { type LegalFormCopy, LegalFormReact } from "../../../../../src/components/forms/legal";
import { CAPTCHA_COPY } from "../../../../../src/components/forms/shared";
import { renderWithUser } from "../../../test-utils";
import { postedTo, reply, serveSite } from "../forms.helpers";

const COPY: LegalFormCopy = {
  formLabel: "Legal request",
  success: "Your request was received.",
  fields: {
    name: { label: "Name", placeholder: "Your name" },
    email: { label: "Email", placeholder: "you@example.com" },
    url: { label: "Link", placeholder: "https://" },
    details: { label: "Details", placeholder: "Describe the request" },
  },
  type: { label: "Request type", placeholder: "Choose a type" },
  types: [
    { value: "copyright", label: "Copyright" },
    { value: "privacy", label: "Privacy" },
  ],
  submit: "Send request",
  sending: "Sending…",
  finePrint: "We answer legal requests in writing.",
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
    typeRequired: "Pick a type",
    urlInvalid: "Link is invalid",
    detailsRequired: "Details are required",
    detailsTooShort: "Details are too short",
    detailsTooLong: "Details are too long",
    captchaRequired: "Solve the sum",
  },
};

const DETAILS = "Please remove the copied article from your blog.";
const field = (label: RegExp) => screen.getByLabelText(label);
const submit = () => screen.getByRole("button", { name: "Send request" });

async function setup(post = () => reply(200)) {
  const fetchMock = serveSite(post);
  const view = renderWithUser(<LegalFormReact copy={COPY} />);
  await screen.findByText("1 + 1 = ?");
  return { ...view, fetchMock };
}

async function fillValid(user: UserEvent, url = "") {
  await user.type(field(/^Name/), "Asha Rao");
  await user.type(field(/^Email/), "asha@example.com");
  await user.selectOptions(field(/^Request type/), "copyright");
  if (url) {
    await user.type(field(/^Link/), url);
  }
  await user.click(field(/^Details/));
  await user.paste(DETAILS);
  await user.type(field(/^Security Check/), "2");
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("LegalFormReact", () => {
  it("renders the request types after a disabled placeholder, and the fine print", async () => {
    await setup();
    const options = screen.getAllByRole("option");
    expect(options.map((option) => option.textContent)).toEqual([
      "Choose a type",
      "Copyright",
      "Privacy",
    ]);
    expect(options[0]).toBeDisabled();
    expect(screen.getByText("We answer legal requests in writing.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: CAPTCHA_COPY.refreshLabel })).toHaveClass(
      "hover:text-amber-fg"
    );
  });

  it("shows every required message and sends nothing when submitted empty", async () => {
    const { user, fetchMock } = await setup();
    await user.click(submit());
    for (const message of [
      "Name is required",
      "Email is required",
      "Pick a type",
      "Details are required",
      "Solve the sum",
    ]) {
      expect(await screen.findByText(message)).toBeInTheDocument();
    }
    expect(screen.queryByText("Link is invalid")).not.toBeInTheDocument();
    expect(postedTo(fetchMock)).toEqual([]);
  });

  it("checks the link once one is typed, and the other limits", async () => {
    const { user } = await setup();
    await user.type(field(/^Name/), "A");
    await user.type(field(/^Link/), "example.com");
    await user.type(field(/^Details/), "Short");
    await user.click(submit());
    expect(await screen.findByText("Link is invalid")).toBeInTheDocument();
    expect(screen.getByText("Too short")).toBeInTheDocument();
    expect(screen.getByText("Details are too short")).toBeInTheDocument();
  });

  it("sends the request with its link and clears the form", async () => {
    const { user, fetchMock } = await setup();
    await fillValid(user, "https://example.com/copied");
    await user.click(submit());
    expect(await screen.findByRole("status")).toHaveTextContent(COPY.success);
    expect(postedTo(fetchMock)).toEqual([
      {
        formType: "legal",
        name: "Asha Rao",
        email: "asha@example.com",
        legalType: "copyright",
        url: "https://example.com/copied",
        details: DETAILS,
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
  });

  it("shows the page's failure notice when the send fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { user } = await setup(() => reply(500));
    await fillValid(user);
    await user.click(submit());
    expect(await screen.findByRole("alert")).toHaveTextContent("Send failed");
  });
});
