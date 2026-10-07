// @vitest-environment jsdom
/** Sending the estimate from the review step: thanks, a wrong answer, a failed send. */
import { screen, waitFor } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QuoteForm } from "../../../../../src/components/company/quote";
import { HIGHLIGHT_EVENT, type HighlightDetail } from "../../../../../src/scripts/stage3d/events";
import { renderWithUser } from "../../../test-utils";
import { mockFormFetch, postedForms, quoteText, type RouteReply } from "../company-fixtures";

const { contact } = quoteText;
const tags: number[] = [];
const onHighlight = (event: Event) => {
  tags.push((event as CustomEvent<HighlightDetail>).detail.tag);
};

/** Renders the form and walks it to the review step with a filled-in contact step. */
async function reachReview(submit?: () => RouteReply) {
  const fetchMock = mockFormFetch(submit);
  const view = renderWithUser(<QuoteForm text={quoteText} />);
  const { user } = view;
  const next = () => user.click(screen.getByRole("button", { name: quoteText.next }));
  await next();
  await next();
  await user.type(screen.getByLabelText(`${contact.firstName} *`), "Ada");
  await user.type(screen.getByLabelText(`${contact.lastName} *`), "Lovelace");
  await user.type(screen.getByLabelText(`${contact.email} *`), "ada@example.com");
  await user.type(screen.getByLabelText(`${contact.notes} ${contact.optional}`), "Call me");
  await next();
  await screen.findByText("1 + 1");
  return { ...view, fetchMock };
}

async function answerAndSend(user: UserEvent, answer: string): Promise<void> {
  await user.type(screen.getByLabelText(/Security Check/), answer);
  await user.click(screen.getByRole("button", { name: quoteText.send }));
}

beforeEach(() => {
  tags.length = 0;
  document.addEventListener(HIGHLIGHT_EVENT, onHighlight);
});

afterEach(() => {
  document.removeEventListener(HIGHLIGHT_EVENT, onHighlight);
  document.documentElement.lang = "";
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("QuoteForm sending", () => {
  it("needs the security answer before it sends", async () => {
    const { user, fetchMock } = await reachReview();
    await user.click(screen.getByRole("button", { name: quoteText.send }));
    expect(await screen.findByText("Please solve the captcha")).toBeInTheDocument();
    expect(postedForms(fetchMock)).toEqual([]);
  });

  it("sends the estimate with its summary and thanks the visitor", async () => {
    const { user, fetchMock } = await reachReview();
    await answerAndSend(user, "2");

    const thanks = await screen.findByRole("status");
    expect(thanks).toHaveTextContent(quoteText.sent);
    expect(screen.getByRole("heading", { name: quoteText.sent })).toHaveFocus();
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
    expect(tags.at(-1)).toBe(4);

    const [posted] = postedForms(fetchMock);
    expect(posted).toMatchObject({
      formType: "contact",
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      company: "",
      subject: "project",
      page: "get-a-quote",
      estimate: "$24,480",
      captchaToken: "token-1",
      captchaAnswer: "2",
    });
    const message = String(posted.message);
    expect(message.startsWith("Call me\n\nEXYCONN - PROJECT BUDGET ESTIMATE")).toBe(true);
    expect(message).toContain(`Contact us: ${quoteText.contactEmail}`);
    expect(message).toContain("ESTIMATED TOTAL: $24,480");
  });

  it("asks a new question when the answer is wrong", async () => {
    const { user } = await reachReview(() => ({ status: 400, body: { error: "captcha" } }));
    await answerAndSend(user, "9");

    expect(await screen.findByText(quoteText.status.incorrect)).toBeInTheDocument();
    expect(await screen.findByText("2 + 1")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: quoteText.steps[3] })).toBeInTheDocument();
  });

  it("keeps the review and shows the failure notice when the send fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { user } = await reachReview(() => ({ status: 502 }));
    await answerAndSend(user, "2");

    expect(await screen.findByText(quoteText.status.failed)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: quoteText.send })).toBeEnabled();
  });

  it("logs the failure instead of crashing when the summary cannot be written", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { user, fetchMock } = await reachReview();
    document.documentElement.lang = "en_US";
    await answerAndSend(user, "2");

    await waitFor(() =>
      expect(error).toHaveBeenCalledWith("The quote form failed", expect.any(RangeError))
    );
    expect(postedForms(fetchMock)).toEqual([]);
    expect(screen.getByRole("form", { name: quoteText.formLabel })).toBeInTheDocument();
  });
});
