import { describe, expect, it } from 'vitest';
import { foldText } from '@/utils/foldText';

describe('foldText', () => {
  it('drops accents and case so a plain search matches accented text', () => {
    expect(foldText('Résumé')).toBe('resume');
    expect(foldText('ÇA VA')).toBe('ca va');
  });

  it('leaves plain text and the empty string as they are, lower-cased', () => {
    expect(foldText('Slack')).toBe('slack');
    expect(foldText('')).toBe('');
  });
});
