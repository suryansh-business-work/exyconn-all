// @vitest-environment jsdom
/** Build-your-suite: validating the contact details and sending the request. */
import { screen } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ORDER_AGENTS_DEFAULTS,
  OrderAgentsForm,
  orderAgentsSchema,
} from "../../../../../src/components/company/order-agents";
import { renderWithUser } from "../../../test-utils";
import { agentsPage, mockFormFetch, postedForms, type RouteReply } from "../company-fixtures";

const { agents, text } = agentsPage;

async function renderForm(submit?: () => RouteReply) {
  const fetchMock = mockFormFetch(submit);
  const view = renderWithUser(<OrderAgentsForm agents={agents} text={text} />);
  await screen.findByText("1 + 1");
  return { ...view, fetchMock };
}

const field = (label: RegExp) => screen.getByLabelText(label);

async function fillRequest(user: UserEvent): Promise<void> {
  await user.click(screen.getByRole("button", { name: `${text.add}: Data Entry Agent` }));
  await user.type(field(/^First name/), "Ada");
  await user.type(field(/^Last name/), "Lovelace");
  await user.type(field(/^Email address/), "ada@example.com");
  await user.type(field(/^Company name/), "Analytical Engines");
  await user.type(field(/^Anything else/), "Need it by Q1");
  await user.type(field(/Security Check/), "2");
}

const send = (user: UserEvent) => user.click(screen.getByRole("button", { name: text.submit }));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("OrderAgentsForm validation", () => {
  it("names every missing field and sends nothing", async () => {
    const { user, fetchMock } = await renderForm();
    await send(user);
    expect(await screen.findByText(text.messages.firstNameRequired)).toBeInTheDocument();
    expect(screen.getByText(text.messages.lastNameRequired)).toBeInTheDocument();
    expect(screen.getByText(text.messages.emailRequired)).toBeInTheDocument();
    expect(screen.getByText(text.messages.captchaRequired)).toBeInTheDocument();
    expect(field(/^First name/)).toHaveAttribute("aria-invalid", "true");
    expect(field(/^Company name/)).toHaveAttribute("aria-invalid", "false");
    expect(postedForms(fetchMock)).toEqual([]);
  });

  it("checks a field when the visitor leaves it", async () => {
    const { user } = await renderForm();
    await user.type(field(/^Email address/), "ada@");
    await user.type(field(/^First name/), "A");
    await user.tab();
    expect(await screen.findByText(text.messages.emailInvalid)).toBeInTheDocument();
    expect(screen.getByText(text.messages.tooShort)).toBeInTheDocument();
  });

  it("refuses notes over the limit", async () => {
    const { user } = await renderForm();
    const notes = field(/^Anything else/);
    await user.click(notes);
    await user.paste("x".repeat(1001));
    await user.tab();
    expect(await screen.findByText(text.messages.tooLong)).toBeInTheDocument();
    expect(notes).toHaveAttribute("aria-invalid", "true");
  });

  it("starts from empty defaults", () => {
    const schema = orderAgentsSchema(
      agents.map((agent) => agent.id),
      text.messages
    );
    expect(schema.safeParse(ORDER_AGENTS_DEFAULTS).success).toBe(false);
    expect(Object.values(ORDER_AGENTS_DEFAULTS).every((value) => value.length === 0)).toBe(true);
  });
});

describe("OrderAgentsForm sending", () => {
  it("sends the suite as a contact enquiry, thanks the visitor and starts over", async () => {
    const { user, fetchMock } = await renderForm();
    await fillRequest(user);
    await send(user);

    expect(await screen.findByRole("status")).toHaveTextContent(text.sent);
    expect(postedForms(fetchMock)).toEqual([
      {
        formType: "contact",
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@example.com",
        company: "Analytical Engines",
        subject: "project",
        page: "order-agents",
        agents: "Data Entry Agent",
        message: "Requested agents: Data Entry Agent\n\nNeed it by Q1",
        captchaToken: "token-1",
        captchaAnswer: "2",
      },
    ]);
    expect(await screen.findByText("2 + 1")).toBeInTheDocument();
    expect(field(/^First name/)).toHaveValue("");
    expect(screen.getByText(text.empty)).toBeInTheDocument();
  });

  it("keeps the request and asks again when the security answer is wrong", async () => {
    const { user } = await renderForm(() => ({ status: 400, body: { error: "captcha" } }));
    await fillRequest(user);
    await send(user);

    expect(await screen.findByText(text.status.incorrect)).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(field(/^First name/)).toHaveValue("Ada");
  });

  it("shows the failure notice when the request cannot be sent", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { user } = await renderForm(() => ({ status: 500 }));
    await fillRequest(user);
    await send(user);

    expect(await screen.findByText(text.status.failed)).toBeInTheDocument();
    expect(field(/^Last name/)).toHaveValue("Lovelace");
  });
});
