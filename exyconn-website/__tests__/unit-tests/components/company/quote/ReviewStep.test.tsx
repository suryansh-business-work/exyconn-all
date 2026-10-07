// @vitest-environment jsdom
/** Quote steps 3 and 4: who to reply to, then the review with the security question. */
import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ContactStep } from "../../../../../src/components/company/quote/ContactStep";
import { ReviewStep } from "../../../../../src/components/company/quote/ReviewStep";
import type { QuoteFormValues } from "../../../../../src/components/company/quote";
import { renderWithUser } from "../../../test-utils";
import { quoteText } from "../company-fixtures";
import { CONTACT, QuoteHarness } from "./quote-harness";

const { contact, review, summary } = quoteText;

function renderReview(values: Partial<QuoteFormValues> = {}, captchaError = "") {
  const onEdit = vi.fn();
  const onRefresh = vi.fn();
  const view = renderWithUser(
    <QuoteHarness values={{ ...CONTACT, ...values }} fields={["captcha"]}>
      <ReviewStep
        steps={quoteText.steps}
        onEdit={onEdit}
        captcha={{ question: "4 + 4", error: captchaError, onRefresh }}
      />
    </QuoteHarness>
  );
  return { ...view, onEdit, onRefresh };
}

describe("ContactStep", () => {
  it("asks who to reply to, marking what is optional", () => {
    renderWithUser(
      <QuoteHarness>
        <ContactStep />
      </QuoteHarness>
    );
    expect(screen.getByLabelText(`${contact.firstName} *`)).toHaveAttribute(
      "autocomplete",
      "given-name"
    );
    expect(screen.getByLabelText(`${contact.email} *`)).toHaveAttribute("type", "email");
    expect(screen.getByLabelText(`${contact.company} ${contact.optional}`)).toBeInTheDocument();
    expect(screen.getByLabelText(`${contact.notes} ${contact.optional}`).tagName).toBe("TEXTAREA");
  });

  it("explains what is missing or wrong", async () => {
    const { user } = renderWithUser(
      <QuoteHarness
        values={{ email: "ada@", company: "x".repeat(101), notes: "y".repeat(1001) }}
        fields={["firstName", "lastName", "email", "company", "notes"]}
      >
        <ContactStep />
      </QuoteHarness>
    );
    await user.click(screen.getByRole("button", { name: "Check" }));
    expect(await screen.findByText("First name is required")).toBeInTheDocument();
    expect(screen.getByText("Last name is required")).toBeInTheDocument();
    expect(screen.getByText("Invalid email address")).toBeInTheDocument();
    expect(screen.getAllByText("Too long!")).toHaveLength(2);
    expect(screen.getByLabelText(`${contact.notes} ${contact.optional}`)).toHaveAttribute(
      "aria-invalid",
      "true"
    );
  });
});

describe("ReviewStep", () => {
  it("shows the estimate and who it is from", () => {
    renderReview();
    expect(screen.getByText(review.lede)).toBeInTheDocument();
    expect(screen.getByText("$24,480")).toHaveClass("quote-total");
    expect(screen.getByText("Ada Lovelace · ada@example.com · Analytical Engines")).toBeVisible();
    const breakdown = document.querySelector(".quote-breakdown") as HTMLElement;
    expect(within(breakdown).getByText(summary.projectType).nextSibling).toHaveTextContent(
      "MVP / Prototype"
    );
    expect(within(breakdown).getByText(summary.team).nextSibling).toHaveTextContent(
      `2 ${summary.members}`
    );
    expect(within(breakdown).getByText(summary.base).nextSibling).toHaveTextContent("$40,800");
    expect(
      within(breakdown).getByText(`${summary.complexity} (0.6x)`).nextSibling
    ).toHaveTextContent("-40%");
  });

  it("leaves the company out when none was given", () => {
    renderReview({ company: "" });
    expect(screen.getByText("Ada Lovelace · ada@example.com")).toBeInTheDocument();
  });

  it("offers a way back to every step before it", async () => {
    const { user, onEdit } = renderReview();
    const edits = screen.getAllByRole("button", { name: new RegExp(`^${review.edit} `) });
    expect(edits.map((button) => button.textContent)).toEqual([
      "Edit service",
      "Edit scope",
      "Edit contact",
    ]);
    await user.click(edits[1]);
    expect(onEdit).toHaveBeenCalledWith(1);
  });

  it("asks the security question and can draw a new one", async () => {
    const { user, onRefresh } = renderReview({}, "That answer was not right.");
    expect(screen.getByText("4 + 4")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("That answer was not right.");
    await user.click(screen.getByRole("button", { name: quoteText.captcha.refreshLabel }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("requires an answer", async () => {
    const { user } = renderReview();
    await user.click(screen.getByRole("button", { name: "Check" }));
    expect(await screen.findByText("Please solve the captcha")).toBeInTheDocument();
  });
});
