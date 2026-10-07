import { vi, type Mock } from 'vitest';

type AnyHook = (...args: never[]) => unknown;

/**
 * What a mocked generated mutation hook hands back: the mutate function the screen calls,
 * plus an idle result. Only the tuple's first slot is read by the forms under test.
 */
export function mutationTuple<Hook extends AnyHook>(mutate: Mock): ReturnType<Hook> {
  return [mutate, { loading: false, called: false }] as unknown as ReturnType<Hook>;
}

/** What a mocked generated query hook hands back: data, loading, error and a refetch. */
export function queryResult<Hook extends AnyHook>(
  result: Readonly<{ data?: unknown; loading?: boolean; error?: Error; refetch?: Mock }>,
): ReturnType<Hook> {
  return {
    loading: false,
    refetch: vi.fn().mockResolvedValue(undefined),
    ...result,
  } as unknown as ReturnType<Hook>;
}

/** Local midnight (or a local time) as the ISO string the MUI X pickers store. */
export const localIso = (...parts: [number, number, number, number?, number?]) =>
  new Date(parts[0], parts[1], parts[2], parts[3] ?? 0, parts[4] ?? 0).toISOString();

/** A picker's input, addressed by its field name as RhfDatePicker/RhfDateTimePicker set it. */
export function pickerInput(name: string): HTMLInputElement {
  const input = document.querySelector<HTMLInputElement>(`input[name="${name}"]`);
  if (!input) throw new Error(`No input named ${name}`);
  return input;
}
