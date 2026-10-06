import { useCallback, useState } from "react";
import type { Tab } from "../state/state";

const SLUGS: Readonly<Record<Tab, string>> = { LIVE: "live", KNOWLEDGE: "knowledge", FAQS: "faqs" };
const TABS = Object.keys(SLUGS) as Tab[];

function tabFromUrl(): Tab {
  const slug = new URL(globalThis.location.href).searchParams.get("tab");
  return TABS.find((tab) => SLUGS[tab] === slug) ?? "LIVE";
}

/**
 * The open section, kept as a `?tab=` slug in the iframe's own URL (the repo's tabs-in-the-URL
 * rule), so a reload of the iframe lands on the same section. `replaceState`: switching
 * sections must not add history entries the host page's back button would walk through.
 */
export function useTabParam(): [Tab, (tab: Tab) => void] {
  const [tab, setTab] = useState(tabFromUrl);
  const select = useCallback((next: Tab) => {
    const url = new URL(globalThis.location.href);
    url.searchParams.set("tab", SLUGS[next]);
    globalThis.history.replaceState(null, "", url);
    setTab(next);
  }, []);
  return [tab, select];
}
