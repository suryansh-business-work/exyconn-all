import { describe, expect, it, vi } from 'vitest';
import {
  assertExportAllowed,
  contextWithoutActions,
  deniedActionKeys,
} from '../../src/page/permissions';

describe('deniedActionKeys', () => {
  it('names nothing when every action is allowed', () => {
    expect(deniedActionKeys(() => true)).toEqual([]);
  });

  it('names only the row actions the viewer may not perform', () => {
    expect(deniedActionKeys((action) => action !== 'delete')).toEqual(['delete']);
    expect(deniedActionKeys(() => false)).toEqual(['edit', 'delete']);
  });
});

describe('contextWithoutActions', () => {
  const edit = vi.fn();
  const remove = vi.fn();
  const send = vi.fn();
  const context = { actions: { edit, delete: remove, send }, formatDate: String };

  it('returns the context untouched when nothing is denied', () => {
    expect(contextWithoutActions(context, [])).toBe(context);
  });

  it('returns it untouched when there is no actions map to filter', () => {
    const plain = { formatDate: String };
    expect(contextWithoutActions(plain, ['edit'])).toBe(plain);
  });

  it('drops the denied handlers and keeps everything else', () => {
    const filtered = contextWithoutActions(context, ['edit', 'delete']);
    expect(Object.keys(filtered.actions)).toEqual(['send']);
    expect(filtered.formatDate).toBe(context.formatDate);
    // The original is not mutated — the page still owns its own object.
    expect(Object.keys(context.actions)).toEqual(['edit', 'delete', 'send']);
  });
});

describe('assertExportAllowed', () => {
  it('resolves when the server clears the module', async () => {
    const check = vi.fn().mockResolvedValue(true);
    await expect(assertExportAllowed(check, 'Invoice')).resolves.toBeUndefined();
    expect(check).toHaveBeenCalledWith('Invoice');
  });

  it('throws before any page is read when the server refuses', async () => {
    await expect(assertExportAllowed(async () => false, 'Invoice')).rejects.toThrow(
      /may not export/,
    );
  });
});
