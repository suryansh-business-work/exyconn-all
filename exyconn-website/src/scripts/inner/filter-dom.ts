import { openFrom } from "./disclosure";
import {
  compareValues,
  fillCount,
  matches,
  parseSort,
  readState,
  writeQuery,
  type FilterItem,
  type FilterState,
} from "./filter";

/**
 * Wires every FilterBar on the page to its list. Items in the list carry
 * `data-filter-item`, `data-filter-<param>="a b"`, `data-search="…"` and
 * `data-sort-<key>="…"`; the bar keeps the URL query in step with its chips, search and sort.
 */
const words = (value: string | undefined): string[] => (value ?? "").split(/\s+/).filter(Boolean);

const readItem = (element: HTMLElement, params: readonly string[]): FilterItem => ({
  values: Object.fromEntries(
    params.map((param) => [param, words(element.getAttribute(`data-filter-${param}`) ?? "")])
  ),
  text: element.dataset.search ?? element.textContent ?? "",
});

/** Re-appends the items in sort order; hidden ones move too, so the order survives a reset. */
const sortItems = (list: HTMLElement, items: readonly HTMLElement[], value: string) => {
  const { key, direction } = parseSort(value);
  const keyOf = (element: HTMLElement) => element.getAttribute(`data-sort-${key}`) ?? undefined;
  items
    .toSorted((a, b) => direction * compareValues(keyOf(a), keyOf(b)))
    .forEach((element) => list.append(element));
};

const setup = (bar: HTMLElement) => {
  const list = document.getElementById(bar.dataset.target ?? "");
  if (!list) {
    console.error("FilterBar target not found", bar.dataset.target);
    return;
  }
  const chips = [...bar.querySelectorAll<HTMLButtonElement>("[data-chip-param]")];
  const chipParams = [...new Set(chips.map((chip) => chip.dataset.chipParam ?? ""))];
  const search = bar.querySelector<HTMLInputElement>("[data-filter-search]");
  const sort = bar.querySelector<HTMLSelectElement>("[data-filter-sort]");
  const count = bar.querySelector<HTMLElement>("[data-filter-count]");
  const empty = document.querySelector<HTMLElement>(`[data-filter-empty="${list.id}"]`);
  const items = [...list.querySelectorAll<HTMLElement>("[data-filter-item]")];
  const params = [...chipParams, search?.name, sort?.name].filter((p): p is string => !!p);
  let state: FilterState = readState(location.search, params);

  const apply = () => {
    chips.forEach((chip) => {
      const active = (state[chip.dataset.chipParam ?? ""] ?? "") === (chip.value ?? "");
      chip.setAttribute("aria-pressed", String(active));
    });
    let shown = 0;
    items.forEach((element) => {
      const visible = matches(readItem(element, chipParams), state, chipParams, search?.name);
      element.hidden = !visible;
      shown += Number(visible);
    });
    if (sort && state[sort.name]) {
      sortItems(list, items, state[sort.name]);
    }
    if (count) {
      count.textContent = fillCount(count.dataset.filterCount ?? "", shown, items.length);
    }
    if (empty) {
      empty.hidden = shown > 0;
    }
  };

  const update = (patch: FilterState) => {
    state = { ...state, ...patch };
    history.replaceState(
      history.state,
      "",
      `${location.pathname}${writeQuery(location.search, state)}${location.hash}`
    );
    apply();
  };

  chips.forEach((chip) =>
    chip.addEventListener("click", () => update({ [chip.dataset.chipParam ?? ""]: chip.value }))
  );
  if (search) {
    search.value = state[search.name] ?? "";
    search.addEventListener("input", () => update({ [search.name]: search.value.trim() }));
  }
  if (sort) {
    sort.value = state[sort.name] || sort.value;
    sort.addEventListener("change", () => update({ [sort.name]: sort.value }));
  }
  const sheet = bar.querySelector<HTMLDetailsElement>("details");
  if (sheet) {
    openFrom(sheet, "(min-width: 768px)");
  }
  apply();
};

export const bootFilterBars = (): void => {
  document.querySelectorAll<HTMLElement>("[data-filter-bar]").forEach(setup);
};
