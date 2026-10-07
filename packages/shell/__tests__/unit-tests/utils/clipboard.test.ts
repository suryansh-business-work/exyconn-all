import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyToClipboard } from '@/utils/clipboard';

function stubClipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
}

describe('copyToClipboard', () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'clipboard');
  });

  it('writes the text and reports success', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);

    await expect(copyToClipboard('INV-0042')).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('INV-0042');
  });

  it('reports failure when the browser refuses the write', async () => {
    stubClipboard(vi.fn().mockRejectedValue(new DOMException('Denied', 'NotAllowedError')));

    await expect(copyToClipboard('x')).resolves.toBe(false);
  });

  it('reports failure when there is no clipboard API at all', async () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });

    await expect(copyToClipboard('x')).resolves.toBe(false);
  });
});
