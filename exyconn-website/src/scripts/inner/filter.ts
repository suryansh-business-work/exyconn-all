/**
 * The FilterBar's rules, independent of the DOM: read and write the filter state in the URL
 * query, decide whether an item matches, and order items for a sort key.
 */
export type FilterState = Readonly<Record<string, string>>;

export interface FilterItem {
  /** Values per chip parameter (an item can sit in several categories). */
  values: Readonly<Record<string, readonly string[]>>;
  /** Text the search box matches against. */
  text: string;
}

export const readState = (query: string, params: readonly string[]): FilterState => {
  const search = new URLSearchParams(query);
  return Object.fromEntries(params.map((param) => [param, search.get(param)?.trim() ?? ""]));
};

/** `current` query with `state` applied; empty values are removed. Returns "" or "?…". */
export const writeQuery = (current: string, state: FilterState): string => {
  const search = new URLSearchParams(current);
  Object.entries(state).forEach(([param, value]) => {
    if (value === "") {
      search.delete(param);
    } else {
      search.set(param, value);
    }
  });
  const text = search.toString();
  return text === "" ? "" : `?${text}`;
};

export const matches = (
  item: FilterItem,
  state: FilterState,
  chipParams: readonly string[],
  searchParam?: string
): boolean => {
  const chipsMatch = chipParams.every((param) => {
    const wanted = state[param] ?? "";
    return wanted === "" || (item.values[param] ?? []).includes(wanted);
  });
  const terms = (searchParam ? (state[searchParam] ?? "") : "")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  const text = item.text.toLowerCase();
  return chipsMatch && terms.every((term) => text.includes(term));
};

/** A sort option value: "date" ascending, "-date" descending. */
export const parseSort = (value: string): { key: string; direction: 1 | -1 } =>
  value.startsWith("-") ? { key: value.slice(1), direction: -1 } : { key: value, direction: 1 };

/** Numbers compare as numbers, anything else as text; missing values sort last. */
export const compareValues = (a: string | undefined, b: string | undefined): number => {
  if (a === undefined || b === undefined) {
    return Number(a === undefined) - Number(b === undefined);
  }
  const x = Number(a);
  const y = Number(b);
  if (a !== "" && b !== "" && Number.isFinite(x) && Number.isFinite(y)) {
    return x - y;
  }
  return a.localeCompare(b);
};

export const fillCount = (template: string, shown: number, total: number): string =>
  template.replaceAll("{shown}", String(shown)).replaceAll("{total}", String(total));
