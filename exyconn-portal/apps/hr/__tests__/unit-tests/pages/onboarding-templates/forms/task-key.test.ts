import { describe, expect, it } from 'vitest';
import { taskKey } from '../../../../../src/pages/onboarding-templates/forms/onboarding-template';

describe('taskKey', () => {
  it('derives a lowercase, dash-separated key from the wording', () => {
    expect(taskKey('Set up the laptop')).toBe('set-up-the-laptop');
  });

  it('collapses punctuation and runs of spaces into one dash', () => {
    expect(taskKey('Sign NDA & contract  (v2)')).toBe('sign-nda-contract-v2');
  });

  it('trims dashes from both ends', () => {
    expect(taskKey('  -- Welcome! --  ')).toBe('welcome');
  });

  it('gives two tasks that read the same the same key', () => {
    expect(taskKey('Order badge')).toBe(taskKey('order BADGE.'));
  });

  it('gives an empty key to wording with no letters or digits', () => {
    expect(taskKey('!!!')).toBe('');
  });
});
