// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import type { TrackerStatus } from '@shared/types';
import StatusChip from '../../../../src/renderer/components/StatusChip';
import { render, unmountAll } from '../../test-utils';

afterEach(unmountAll);

describe('StatusChip', () => {
  it.each<[TrackerStatus, string]>([
    ['signed-out', 'Signed out'],
    ['consent-required', 'Consent required'],
    ['idle', 'Not tracking'],
    ['tracking', 'Tracking…'],
    ['paused', 'Paused'],
  ])('labels %s as "%s"', async (status, label) => {
    await render(<StatusChip status={status} />);
    expect(document.querySelector('.MuiChip-label')?.textContent).toBe(label);
    // The status dot sits in the chip's icon slot, just before the label. StatusDot does not
    // forward MUI's className, so it carries no .MuiChip-icon class to look it up by.
    const dot = document.querySelector('.MuiChip-label')?.previousElementSibling;
    expect(dot).toBeInstanceOf(HTMLDivElement);
  });
});
