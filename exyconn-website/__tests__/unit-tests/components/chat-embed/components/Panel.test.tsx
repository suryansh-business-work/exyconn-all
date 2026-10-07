// @vitest-environment jsdom
/** The open chat panel: a labelled dialog with the header, the tabs and their sections. */
import { createRef, type Ref } from "react";
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Panel } from "../../../../../src/components/chat-embed/components/Panel";
import type { ChatState, Tab } from "../../../../../src/components/chat-embed/state/state";
import { strings } from "../../../../../src/components/chat-embed/strings";
import { renderInChatTheme } from "../../../test-utils";
import { makeActions, makeConfig, makeState } from "../chat-fixtures";

interface Options {
  state?: ChatState;
  tab?: Tab;
  compact?: boolean;
  ref?: Ref<HTMLDivElement>;
}

function mount({
  state = makeState({ config: makeConfig() }),
  tab = "LIVE",
  compact = false,
  ref,
}: Options = {}) {
  const actions = makeActions();
  const onTab = vi.fn();
  const onClose = vi.fn();
  const view = renderInChatTheme(
    <Panel
      ref={ref}
      state={state}
      actions={actions}
      tab={tab}
      onTab={onTab}
      compact={compact}
      onClose={onClose}
    />
  );
  return { ...view, actions, onTab, onClose };
}

const panels = () => screen.getAllByRole("tabpanel", { hidden: true });

describe("Panel", () => {
  it("is a dialog named by its header, focused when it opens", () => {
    mount();
    const dialog = screen.getByRole("dialog", { name: strings.defaultTitle });
    expect(dialog).toHaveFocus();
  });

  it("shows only the open section, each tied to its tab", () => {
    mount({ tab: "FAQS" });
    const [live, knowledge, faqs] = panels();
    expect(live).toHaveAttribute("hidden");
    expect(knowledge).toHaveAttribute("hidden");
    expect(faqs).not.toHaveAttribute("hidden");
    const faqTab = screen.getByRole("tab", { name: strings.tabFaqs });
    expect(faqs).toHaveAttribute("aria-labelledby", faqTab.id);
    expect(faqTab).toHaveAttribute("aria-controls", faqs.id);
  });

  it("switches sections from the tabs", async () => {
    const { user, onTab } = mount();
    await user.click(screen.getByRole("tab", { name: strings.tabKnowledge }));
    expect(onTab).toHaveBeenCalledWith("KNOWLEDGE");
  });

  it("closes on Escape", () => {
    const { onClose } = mount();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("leaves an Escape already handled inside it alone, and ignores other keys", () => {
    const { onClose } = mount();
    const tab = screen.getByRole("tab", { name: strings.tabLive });
    tab.addEventListener("keydown", (event) => event.preventDefault());
    fireEvent.keyDown(tab, { key: "Escape" });
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Enter" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("shows a problem that names no message, and dismisses it", async () => {
    const { user, actions } = mount({ state: makeState({ error: strings.notConnected }) });
    expect(screen.getByRole("alert")).toHaveTextContent(strings.notConnected);
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(actions.dismissError).toHaveBeenCalledTimes(1);
  });

  it("shows no alert without a problem", () => {
    mount();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("hands its node to an object ref and to a callback ref", () => {
    const objectRef = createRef<HTMLDivElement>();
    const first = mount({ ref: objectRef, compact: true });
    expect(objectRef.current).toBe(screen.getByRole("dialog"));
    first.unmount();
    const callback = vi.fn();
    mount({ ref: callback });
    expect(callback).toHaveBeenCalledWith(screen.getByRole("dialog"));
  });

  it("lists the FAQs from the config, and none before it arrives", () => {
    const faqs = [{ id: "f1", question: "Who are you?", answer: "Exyconn." }];
    const withFaqs = mount({ state: makeState({ config: makeConfig({ faqs }) }), tab: "FAQS" });
    expect(screen.getByRole("button", { name: "Who are you?" })).toBeInTheDocument();
    withFaqs.unmount();
    mount({ state: makeState(), tab: "FAQS" });
    expect(screen.getByText(strings.noFaqs)).toBeInTheDocument();
  });
});
