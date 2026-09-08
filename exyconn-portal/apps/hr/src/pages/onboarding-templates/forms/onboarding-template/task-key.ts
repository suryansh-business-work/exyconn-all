/**
 * The stable identifier a checklist ticks a task off by, derived from its wording.
 *
 * Derived rather than typed by HR because it is an implementation detail: a key nobody has
 * to invent is a key nobody can get wrong. It only has to be unique inside one template —
 * a checklist copies the tasks when it starts, so renaming a task later cannot orphan
 * anybody's ticks.
 */
export function taskKey(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-|-$/g, '');
}
