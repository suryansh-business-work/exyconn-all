// @vitest-environment jsdom
/** Step one of the live WhatsApp demo: the lead, the security question and the code email. */
import { screen, waitFor } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DemoLeadForm } from "../../../../../src/components/forms/whatsapp-demo";
import { CAPTCHA_COPY } from "../../../../../src/components/forms/shared";
import { renderWithUser } from "../../../test-utils";
import { type FakeReply, postedTo, reply, serveSite } from "../forms.helpers";

const CODE_ROUTE = "/api/whatsapp-demo/code";
const LOAD_FAILED = "The security question could not be loaded. Please refresh it.";
const field = (label: RegExp) => screen.getByLabelText(label);
const submit = () => screen.getByRole("button", { name: "Email me my demo code" });

async function setup(post: () => FakeReply | Promise<FakeReply> = () => reply(200, {})) {
  const fetchMock = serveSite(post);
  const onCodeSent = vi.fn();
  const view = renderWithUser(<DemoLeadForm onCodeSent={onCodeSent} />);
  await screen.findByText("1 + 1 = ?");
  return { ...view, fetchMock, onCodeSent };
}

async function fillValid(user: UserEvent) {
  await user.type(field(/^Your name/), " Meera Iyer ");
  await user.type(field(/^Work email/), "Meera@Example.com");
  await user.type(field(/^Security Check/), "2");
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("DemoLeadForm", () => {
  it("shows the required messages and sends nothing when submitted empty", async () => {
    const { user, fetchMock, onCodeSent } = await setup();
    await user.click(submit());
    expect(await screen.findByText("Your name is required")).toBeInTheDocument();
    expect(screen.getByText("Work email is required")).toBeInTheDocument();
    expect(screen.getByText("Please solve the captcha")).toBeInTheDocument();
    expect(postedTo(fetchMock, CODE_ROUTE)).toEqual([]);
    expect(onCodeSent).not.toHaveBeenCalled();
  });

  it("checks a phone once one is typed", async () => {
    const { user } = await setup();
    await user.type(field(/^Phone/), "abc");
    await user.click(submit());
    expect(await screen.findByText("Enter a valid phone number")).toBeInTheDocument();
  });

  it("files the lead with the captcha and passes on the address, lower-cased", async () => {
    const { user, fetchMock, onCodeSent } = await setup();
    await fillValid(user);
    await user.type(field(/^Company/), "Acme");
    await user.click(submit());
    await waitFor(() => expect(onCodeSent).toHaveBeenCalledWith("meera@example.com"));
    expect(postedTo(fetchMock, CODE_ROUTE)).toEqual([
      {
        name: "Meera Iyer",
        email: "Meera@Example.com",
        company: "Acme",
        phone: "",
        captchaToken: "token-1",
        captchaAnswer: "2",
      },
    ]);
  });

  it("shows a refused answer under the question and draws a new one", async () => {
    const { user, onCodeSent } = await setup(() =>
      reply(400, { error: "captcha", message: "That answer was not right." })
    );
    await fillValid(user);
    await user.click(submit());
    expect(await screen.findByText("That answer was not right.")).toBeInTheDocument();
    expect(await screen.findByText("2 + 1 = ?")).toBeInTheDocument();
    expect(field(/^Security Check/)).toHaveAttribute("aria-invalid", "true");
    expect(onCodeSent).not.toHaveBeenCalled();
  });

  it("shows any other refusal in the route's words", async () => {
    const { user } = await setup(() => reply(429, { message: "Too many requests today." }));
    await fillValid(user);
    await user.click(submit());
    expect(await screen.findByRole("alert")).toHaveTextContent("Too many requests today.");
  });

  it("shows a general message when the request itself fails", async () => {
    const { user } = await setup(() => Promise.reject(new TypeError("offline")));
    await fillValid(user);
    await user.click(submit());
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Something went wrong. Please try again."
    );
  });

  it("reports a question that failed to load, and a refresh clears it", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const fetchMock = serveSite();
    fetchMock.mockResolvedValueOnce(reply(500));
    const { user } = renderWithUser(<DemoLeadForm onCodeSent={vi.fn()} />);
    expect(await screen.findByText(LOAD_FAILED)).toBeInTheDocument();
    expect(log).toHaveBeenCalledWith(
      "The security question could not be loaded",
      expect.any(Error)
    );
    await user.click(screen.getByRole("button", { name: CAPTCHA_COPY.refreshLabel }));
    expect(await screen.findByText("1 + 1 = ?")).toBeInTheDocument();
    expect(screen.queryByText(LOAD_FAILED)).not.toBeInTheDocument();
  });

  it("still logs when reporting a failed load itself throws", async () => {
    const thrown = new Error("console broke");
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    log.mockImplementationOnce(() => {
      throw thrown;
    });
    serveSite().mockResolvedValue(reply(500));
    const { user } = renderWithUser(<DemoLeadForm onCodeSent={vi.fn()} />);
    await waitFor(() => expect(log).toHaveBeenCalledWith(thrown));
    log.mockImplementationOnce(() => {
      throw thrown;
    });
    await user.click(screen.getByRole("button", { name: CAPTCHA_COPY.refreshLabel }));
    await waitFor(() => expect(log.mock.calls.filter(([arg]) => arg === thrown)).toHaveLength(2));
  });
});

describe("DemoLeadForm length limits", () => {
  it("refuses a company name over 120 characters once the field is left", async () => {
    const { user, fetchMock } = await setup();
    await user.click(field(/^Company/));
    await user.paste("c".repeat(121));
    await user.tab();

    expect(await screen.findByText("Too long!")).toBeInTheDocument();
    expect(field(/^Company/)).toHaveAttribute("aria-invalid", "true");
    expect(postedTo(fetchMock, CODE_ROUTE)).toEqual([]);
  });
});
