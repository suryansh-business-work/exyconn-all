// @vitest-environment jsdom
/** The get-a-quote form's four steps: checking each, moving between them, the live summary. */
import { screen, waitFor } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QuoteForm, QuoteSummary } from "../../../../../src/components/company/quote";
import { FORM_STEP_EVENT, type FormStepDetail } from "../../../../../src/scripts/inner/form-step";
import { HIGHLIGHT_EVENT, type HighlightDetail } from "../../../../../src/scripts/stage3d/events";
import { renderWithUser } from "../../../test-utils";
import { mockFormFetch, quoteText } from "../company-fixtures";

const { contact } = quoteText;
const steps: number[] = [];
const tags: number[] = [];
const onStep = (event: Event) => {
  steps.push((event as CustomEvent<FormStepDetail>).detail.index);
};
const onHighlight = (event: Event) => {
  tags.push((event as CustomEvent<HighlightDetail>).detail.tag);
};

async function renderQuote() {
  const fetchMock = mockFormFetch();
  const view = renderWithUser(<QuoteForm text={quoteText} />);
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  return view;
}

const title = () => screen.getByRole("heading", { level: 2 });
const next = (user: UserEvent) => user.click(screen.getByRole("button", { name: quoteText.next }));
const back = (user: UserEvent) => user.click(screen.getByRole("button", { name: quoteText.back }));

beforeEach(() => {
  steps.length = 0;
  tags.length = 0;
  document.addEventListener(FORM_STEP_EVENT, onStep);
  document.addEventListener(HIGHLIGHT_EVENT, onHighlight);
});

afterEach(() => {
  document.removeEventListener(FORM_STEP_EVENT, onStep);
  document.removeEventListener(HIGHLIGHT_EVENT, onHighlight);
  vi.unstubAllGlobals();
});

describe("QuoteForm steps", () => {
  it("opens on the service step without stealing focus", async () => {
    await renderQuote();
    expect(screen.getByRole("form", { name: quoteText.formLabel })).toBeInTheDocument();
    expect(title()).toHaveTextContent(quoteText.steps[0]);
    expect(title()).not.toHaveFocus();
    expect(screen.queryByRole("button", { name: quoteText.back })).not.toBeInTheDocument();
    expect(screen.getAllByRole("radio", { name: /MVP/ })).toHaveLength(1);
  });

  it("moves on and back, announcing each step and focusing its title", async () => {
    const { user } = await renderQuote();
    await next(user);
    expect(title()).toHaveTextContent(quoteText.steps[1]);
    expect(title()).toHaveFocus();
    expect(screen.getByRole("group", { name: quoteText.scope.team })).toBeInTheDocument();

    await back(user);
    expect(title()).toHaveTextContent(quoteText.steps[0]);
    expect(title()).toHaveFocus();
    expect(steps).toEqual([1, 0]);
    expect(tags).toEqual([1]);
  });

  it("holds the visitor on a step until it is valid", async () => {
    const { user } = await renderQuote();
    await next(user);
    await next(user);
    expect(title()).toHaveTextContent(quoteText.steps[2]);

    await next(user);
    expect(await screen.findByText("First name is required")).toBeInTheDocument();
    expect(title()).toHaveTextContent(quoteText.steps[2]);
    expect(steps).toEqual([1, 2]);

    await user.type(screen.getByLabelText(`${contact.firstName} *`), "Ada");
    await user.type(screen.getByLabelText(`${contact.lastName} *`), "Lovelace");
    await user.type(screen.getByLabelText(`${contact.email} *`), "ada@example.com");
    await next(user);
    expect(title()).toHaveTextContent(quoteText.steps[3]);
    expect(screen.getByRole("button", { name: quoteText.send })).toHaveAttribute("type", "submit");
    expect(screen.queryByRole("button", { name: quoteText.next })).not.toBeInTheDocument();
    expect(tags).toEqual([1, 2, 3]);
  });

  it("jumps back to a step from the review", async () => {
    const { user } = await renderQuote();
    await next(user);
    await next(user);
    await user.type(screen.getByLabelText(`${contact.firstName} *`), "Ada");
    await user.type(screen.getByLabelText(`${contact.lastName} *`), "Lovelace");
    await user.type(screen.getByLabelText(`${contact.email} *`), "ada@example.com");
    await next(user);

    await user.click(screen.getByRole("button", { name: "Edit scope" }));
    expect(title()).toHaveTextContent(quoteText.steps[1]);
    expect(title()).toHaveFocus();
    expect(steps.at(-1)).toBe(1);
  });
});

describe("QuoteForm and its summary panel", () => {
  it("keeps the summary's total in step with the form", async () => {
    mockFormFetch();
    const { user } = renderWithUser(
      <>
        <QuoteForm text={quoteText} />
        <QuoteSummary text={quoteText.summary} contactEmail={quoteText.contactEmail} />
      </>
    );
    const total = () => document.querySelector(".quote-summary .quote-total");
    expect(total()).toHaveTextContent("$24,480");

    await user.click(screen.getByRole("radio", { name: /Enterprise App/ }));
    await waitFor(() => expect(total()).toHaveTextContent("$61,200"));

    await next(user);
    await user.click(screen.getByRole("radio", { name: /^12 Months/ }));
    await waitFor(() => expect(total()).toHaveTextContent("$244,800"));
  });
});
