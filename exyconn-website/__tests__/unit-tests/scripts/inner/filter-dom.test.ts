// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bootFilterBars } from "../../../../src/scripts/inner/filter-dom";
import { stubMatchMedia, type MediaControl } from "../script-dom";

const BAR = `
  <div data-filter-bar data-target="list">
    <details>
      <summary>Filters</summary>
      <button id="all" data-chip-param="cat" value="">All</button>
      <button id="ai" data-chip-param="cat" value="ai">AI</button>
      <button id="web" data-chip-param="cat" value="web">Web</button>
      <input id="search" data-filter-search name="q" />
      <select id="sort" data-filter-sort name="sort">
        <option value="title">Title</option>
        <option value="date">Oldest</option>
        <option value="-date">Newest</option>
      </select>
    </details>
    <p id="count" data-filter-count="{shown} of {total}"></p>
  </div>
`;
const LIST = `
  <ul id="list">
    <li id="chat" data-filter-item data-filter-cat="ai web" data-search="Chat bot" data-sort-title="Chat" data-sort-date="3">Chat</li>
    <li id="atlas" data-filter-item data-filter-cat="web" data-sort-title="Atlas" data-sort-date="1">Atlas site</li>
    <li id="beacon" data-filter-item data-sort-title="Beacon">Beacon</li>
  </ul>
  <p id="empty" data-filter-empty="list" hidden>Nothing matches</p>
`;

let media: MediaControl;
const byId = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const shown = () =>
  [...document.querySelectorAll<HTMLElement>("[data-filter-item]")]
    .filter((item) => !item.hidden)
    .map((item) => item.id);
const order = () => [...byId("list").children].map((item) => item.id);
const pressed = () =>
  ["all", "ai", "web"].filter((id) => byId(id).getAttribute("aria-pressed") === "true");

const boot = (html = BAR + LIST, url = "/insights") => {
  history.replaceState(null, "", url);
  document.body.innerHTML = html;
  bootFilterBars();
};

const search = (value: string) => {
  byId<HTMLInputElement>("search").value = value;
  byId("search").dispatchEvent(new Event("input"));
};

beforeEach(() => {
  media = stubMatchMedia(false);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  history.replaceState(null, "", "/");
  document.body.innerHTML = "";
});

describe("FilterBar on load", () => {
  it("shows every item with the 'All' chip pressed and the count filled in", () => {
    boot();
    expect(shown()).toEqual(["chat", "atlas", "beacon"]);
    expect(pressed()).toEqual(["all"]);
    expect(byId("count").textContent).toBe("3 of 3");
    expect(byId("empty").hidden).toBe(true);
    expect(order()).toEqual(["chat", "atlas", "beacon"]);
    expect(byId<HTMLSelectElement>("sort").value).toBe("title");
  });

  it("restores chips, search and sort from the URL", () => {
    boot(undefined, "/insights?cat=web&q=site&sort=-date");
    expect(pressed()).toEqual(["web"]);
    expect(byId<HTMLInputElement>("search").value).toBe("site");
    expect(byId<HTMLSelectElement>("sort").value).toBe("-date");
    expect(shown()).toEqual(["atlas"]);
    expect(byId("count").textContent).toBe("1 of 3");
  });

  it("opens the filter sheet from tablet width up", () => {
    boot();
    expect(media.query).toHaveBeenCalledWith("(min-width: 768px)");
    expect(document.querySelector("details")?.open).toBe(false);
    media.change(true);
    expect(document.querySelector("details")?.open).toBe(true);
  });
});

describe("FilterBar interactions", () => {
  it("filters by chip and keeps the choice in the URL with the rest of the query and hash", () => {
    boot(undefined, "/insights?page=2#list");
    byId("ai").click();
    expect(shown()).toEqual(["chat"]);
    expect(pressed()).toEqual(["ai"]);
    expect(location.pathname).toBe("/insights");
    expect(new URLSearchParams(location.search).get("cat")).toBe("ai");
    expect(new URLSearchParams(location.search).get("page")).toBe("2");
    expect(location.hash).toBe("#list");

    byId("all").click();
    expect(shown()).toEqual(["chat", "atlas", "beacon"]);
    expect(location.search).toBe("?page=2");
  });

  it("matches every search term against an item's search text or its content", () => {
    boot();
    search("  BOT ");
    expect(shown()).toEqual(["chat"]);
    // The query keeps what was typed, trimmed; matching ignores case.
    expect(location.search).toBe("?q=BOT");
    search("atlas site");
    expect(shown()).toEqual(["atlas"]);
  });

  it("shows the empty note when nothing matches", () => {
    boot();
    byId("ai").click();
    search("beacon");
    expect(shown()).toEqual([]);
    expect(byId("count").textContent).toBe("0 of 3");
    expect(byId("empty").hidden).toBe(false);
  });

  it("orders the list by the chosen key, hidden items included", () => {
    boot();
    byId("web").click();
    const sort = byId<HTMLSelectElement>("sort");
    sort.value = "-date";
    sort.dispatchEvent(new Event("change"));
    expect(order().filter((id) => id !== "beacon")).toEqual(["chat", "atlas"]);
    expect(location.search).toContain("sort=-date");

    sort.value = "date";
    sort.dispatchEvent(new Event("change"));
    // Ascending puts the undated item last; it is hidden by the chip but keeps its place.
    expect(order()).toEqual(["atlas", "chat", "beacon"]);
    expect(byId("beacon").hidden).toBe(true);

    sort.value = "title";
    sort.dispatchEvent(new Event("change"));
    expect(order()).toEqual(["atlas", "beacon", "chat"]);
  });
});

describe("FilterBar setups", () => {
  it("logs and skips a bar whose list is missing", () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => undefined);
    boot(BAR.replace('data-target="list"', 'data-target="nowhere"'));
    expect(logged).toHaveBeenCalledWith("FilterBar target not found", "nowhere");
    boot(BAR.replace(' data-target="list"', ""));
    expect(logged).toHaveBeenLastCalledWith("FilterBar target not found", undefined);
  });

  it("works with chips alone: no search, sort, count, sheet or empty note", () => {
    boot(`
      <div data-filter-bar data-target="list">
        <button id="all" data-chip-param="cat" value="">All</button>
        <button id="ai" data-chip-param="cat" value="ai">AI</button>
        <button id="web" data-chip-param="cat">Web</button>
      </div>
      <ul id="list">
        <li id="chat" data-filter-item data-filter-cat="ai">Chat</li>
        <li id="atlas" data-filter-item>Atlas</li>
      </ul>
    `);
    expect(media.query).not.toHaveBeenCalled();
    byId("ai").click();
    expect(shown()).toEqual(["chat"]);
    // A chip with no value means "any", like "All".
    byId("web").click();
    expect(shown()).toEqual(["chat", "atlas"]);
  });
});
