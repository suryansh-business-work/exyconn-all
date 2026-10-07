import { describe, expect, it } from 'vitest';
import { activityColor, activityLabel } from '../../src/activity';
import { t } from './translator';

describe('activityColor', () => {
  it('reads 70% and above as healthy', () => {
    expect(activityColor(70)).toBe('success');
    expect(activityColor(100)).toBe('success');
  });

  it('reads anything under 70% as a nudge, never a failure', () => {
    expect(activityColor(69)).toBe('warning');
    expect(activityColor(0)).toBe('warning');
  });
});

describe('activityLabel', () => {
  it('states the percentage in a translatable sentence', () => {
    expect(activityLabel(t, 42)).toBe('42% active');
  });
});
