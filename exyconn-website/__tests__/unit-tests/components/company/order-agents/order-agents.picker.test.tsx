// @vitest-environment jsdom
/** Build-your-suite: adding and removing agents, the suite list and the stage highlight. */
import { screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { OrderAgentsForm } from "../../../../../src/components/company/order-agents";
import { HIGHLIGHT_EVENT, type HighlightDetail } from "../../../../../src/scripts/stage3d/events";
import { renderWithUser } from "../../../test-utils";
import { agentsPage, mockFormFetch } from "../company-fixtures";

const { agents, text } = agentsPage;
const tags: number[] = [];
const onHighlight = (event: Event) => {
  tags.push((event as CustomEvent<HighlightDetail>).detail.tag);
};

async function renderForm() {
  const view = renderWithUser(<OrderAgentsForm agents={agents} text={text} />);
  await screen.findByText("1 + 1");
  return view;
}

const addButton = (name: string) => screen.getByRole("button", { name: `${text.add}: ${name}` });
const card = (name: string) => screen.getByRole("heading", { name }).closest("li") as HTMLElement;
const chips = () =>
  [...document.querySelectorAll<HTMLButtonElement>(".inner-chip")].map((chip) =>
    chip.getAttribute("aria-label")
  );

beforeEach(() => {
  tags.length = 0;
  document.addEventListener(HIGHLIGHT_EVENT, onHighlight);
  mockFormFetch();
});

afterEach(() => {
  document.removeEventListener(HIGHLIGHT_EVENT, onHighlight);
});

describe("OrderAgentsForm picking agents", () => {
  it("lists every agent on offer and starts with an empty suite", async () => {
    await renderForm();
    expect(screen.getAllByRole("button", { name: new RegExp(`^${text.add}:`) })).toHaveLength(
      agents.length
    );
    expect(screen.getByText(`0 of ${agents.length} selected`)).toBeInTheDocument();
    expect(screen.getByText(text.empty)).toBeInTheDocument();
    expect(chips()).toEqual([]);
  });

  it("adds an agent to the suite and marks its card", async () => {
    const { user } = await renderForm();
    await user.click(addButton("Data Entry Agent"));

    expect(screen.getByText(`1 of ${agents.length} selected`)).toBeInTheDocument();
    expect(screen.queryByText(text.empty)).not.toBeInTheDocument();
    expect(chips()).toEqual([`${text.remove}: Data Entry Agent`]);
    const added = card("Data Entry Agent");
    expect(added).toHaveClass("agents-card--added");
    expect(within(added).getByText(text.added)).toBeInTheDocument();
    expect(within(added).getByRole("button")).toHaveAccessibleName(
      `${text.remove}: Data Entry Agent`
    );
    expect(card("HR Onboarding Agent")).not.toHaveClass("agents-card--added");
    expect(tags).toEqual([1]);
  });

  it("keeps the suite in catalogue order and lights one tag per agent", async () => {
    const { user } = await renderForm();
    await user.click(addButton("HR Onboarding Agent"));
    await user.click(addButton("Sales Automation Agent"));
    expect(chips()).toEqual([
      `${text.remove}: Sales Automation Agent`,
      `${text.remove}: HR Onboarding Agent`,
    ]);
    expect(tags).toEqual([1, 2]);
  });

  it("removes agents from the suite chip or the card, and clears the stage when empty", async () => {
    const { user } = await renderForm();
    await user.click(addButton("Data Entry Agent"));
    await user.click(addButton("Customer Support Agent"));

    const chip = document.querySelector<HTMLButtonElement>(
      `.inner-chip[aria-label="${text.remove}: Data Entry Agent"]`
    ) as HTMLButtonElement;
    await user.click(chip);
    expect(chips()).toEqual([`${text.remove}: Customer Support Agent`]);

    await user.click(within(card("Customer Support Agent")).getByRole("button"));
    expect(chips()).toEqual([]);
    expect(screen.getByText(text.empty)).toBeInTheDocument();
    expect(tags).toEqual([1, 2, 1, -1]);
  });

  it("does not complain about an empty suite before the first send", async () => {
    const { user } = await renderForm();
    await user.click(addButton("Data Entry Agent"));
    await user.click(within(card("Data Entry Agent")).getByRole("button"));
    expect(screen.queryByText(text.messages.pickOne)).not.toBeInTheDocument();
  });

  it("re-checks the suite as it changes once a send was tried", async () => {
    const { user } = await renderForm();
    await user.click(screen.getByRole("button", { name: text.submit }));
    expect(await screen.findByText(text.messages.pickOne)).toHaveAttribute("role", "alert");

    await user.click(addButton("Data Entry Agent"));
    await waitFor(() => expect(screen.queryByText(text.messages.pickOne)).not.toBeInTheDocument());
  });
});
