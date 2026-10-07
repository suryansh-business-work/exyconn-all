// @vitest-environment jsdom
/** The three chat sections as WAI-ARIA tabs. */
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SectionTabs } from "../../../../../src/components/chat-embed/components/SectionTabs";
import type { Tab } from "../../../../../src/components/chat-embed/state/state";
import { strings } from "../../../../../src/components/chat-embed/strings";
import { renderInChatTheme } from "../../../test-utils";

const tabId = (tab: Tab) => `tab-${tab}`;
const panelId = (tab: Tab) => `panel-${tab}`;

function mount(tab: Tab) {
  const onTab = vi.fn();
  const view = renderInChatTheme(
    <SectionTabs tab={tab} onTab={onTab} tabId={tabId} panelId={panelId} />
  );
  return { ...view, onTab };
}

describe("SectionTabs", () => {
  it("labels the tab list and ties each tab to its panel", () => {
    mount("LIVE");
    expect(screen.getByRole("tablist", { name: strings.tabsLabel })).toBeInTheDocument();
    const live = screen.getByRole("tab", { name: strings.tabLive });
    expect(live).toHaveAttribute("id", "tab-LIVE");
    expect(live).toHaveAttribute("aria-controls", "panel-LIVE");
    expect(screen.getByRole("tab", { name: strings.tabFaqs })).toHaveAttribute(
      "aria-controls",
      "panel-FAQS"
    );
  });

  it("marks the open section as selected", () => {
    mount("KNOWLEDGE");
    expect(screen.getByRole("tab", { name: strings.tabKnowledge })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByRole("tab", { name: strings.tabLive })).toHaveAttribute(
      "aria-selected",
      "false"
    );
  });

  it("asks for another section when its tab is chosen", async () => {
    const { user, onTab } = mount("LIVE");
    await user.click(screen.getByRole("tab", { name: strings.tabFaqs }));
    expect(onTab).toHaveBeenCalledWith("FAQS");
  });
});
