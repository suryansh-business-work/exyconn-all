import { describe, expect, it } from 'vitest';
import {
  FONT_WEIGHTS,
  customFontSchema,
  guessFromName,
} from '../../../../../../src/pages/website/forms/cms-custom-font/cms-custom-font.types';
import { fontFile } from './font-files';

const row = (overrides: Record<string, unknown> = {}) => ({
  file: fontFile('Brand-Regular.woff2'),
  weight: '400',
  style: 'normal',
  format: 'woff2',
  ...overrides,
});

/** The first message a parse fails with for each field path, as the form's resolver shows it. */
function errorsOf(values: unknown): Record<string, string> {
  const result = customFontSchema.safeParse(values);
  const errors: Record<string, string> = {};
  for (const issue of result.error?.issues ?? []) {
    errors[issue.path.join('.')] ??= issue.message;
  }
  return errors;
}

describe('guessFromName', () => {
  it.each([
    ['Inter-Thin.woff2', '100', 'normal'],
    ['Inter-Hairline.ttf', '100', 'normal'],
    ['Inter-ExtraLight.woff2', '200', 'normal'],
    ['Inter-Ultra-Light.otf', '200', 'normal'],
    ['Inter-Light.woff2', '300', 'normal'],
    ['Inter-Regular.woff2', '400', 'normal'],
    ['Inter-MediumItalic.woff2', '500', 'italic'],
    ['Inter-SemiBold.woff2', '600', 'normal'],
    ['Inter-DemiBold.woff', '600', 'normal'],
    ['Inter-Bold.woff2', '700', 'normal'],
    ['Inter-ExtraBold.woff2', '800', 'normal'],
    ['Inter-Black.woff2', '900', 'normal'],
    ['Inter-HeavyOblique.woff2', '900', 'italic'],
  ])('reads %s as weight %s, %s', (name, weight, style) => {
    expect(guessFromName(name)).toEqual({ weight, style });
  });
});

describe('customFontSchema', () => {
  it('accepts a named family with at least one font file', () => {
    expect(errorsOf({ family: 'Brand Sans', files: [row()] })).toEqual({});
  });

  it('needs a family name made of letters, digits and a few marks', () => {
    expect(errorsOf({ family: '   ', files: [row()] }).family).toBe('Name the family');
    expect(errorsOf({ family: 'Brand<Sans>', files: [row()] }).family).toBe(
      "Letters, digits, spaces and . ' & - only, up to 80 characters",
    );
  });

  it('needs between one and forty files', () => {
    expect(errorsOf({ family: 'Brand', files: [] }).files).toBe('Add at least one font file');
    expect(
      errorsOf({ family: 'Brand', files: Array.from({ length: 41 }, () => row()) }).files,
    ).toBe('At most 40 files');
  });

  it('checks each file: a real file of 5 MB or less, a weight and a known style and format', () => {
    const errors = errorsOf({
      family: 'Brand',
      files: [
        row({ file: fontFile('Big.woff2', 5 * 1024 * 1024 + 1) }),
        row({ file: 'Brand.woff2', weight: '450', style: 'oblique', format: 'eot' }),
      ],
    });

    expect(errors['files.0.file']).toBe('Each file must be 5 MB or smaller');
    expect(errors['files.1.file']).toBe('Pick a file');
    expect(errors['files.1.weight']).toBe('A weight from 100 to 900');
    expect(Object.keys(errors)).toEqual(
      expect.arrayContaining(['files.1.style', 'files.1.format']),
    );
  });

  it('offers the nine standard weights', () => {
    expect(FONT_WEIGHTS).toEqual(['100', '200', '300', '400', '500', '600', '700', '800', '900']);
  });
});
