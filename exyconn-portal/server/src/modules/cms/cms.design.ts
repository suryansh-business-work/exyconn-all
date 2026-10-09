import { badRequest, notFound } from '../../utils/errors';
import { CmsDesignSystemModel } from './models';

export interface CmsDesignSystemInput {
  siteId: string;
  name: string;
  tokens: Record<string, unknown>;
  extraCss?: string | null;
}

const TOKEN_GROUPS = new Set([
  'palette',
  'colors',
  'fonts',
  'radii',
  'shadows',
  'spacing',
  'fontSources',
]);

const FONT_FAMILY = /^[\p{L}\d][\p{L}\d .'&-]{0,79}$/u;
const FONT_VARIANT = /^[1-9]00i?$/;
const FONT_WEIGHT = /^[1-9]00$/;
const FONT_FORMATS = new Set(['woff2', 'woff', 'truetype', 'opentype']);
const FONT_STYLES = new Set(['normal', 'italic']);
const MAX_FONT_SOURCES = 30;
const MAX_FONT_FILES = 40;

interface FontFile {
  url?: unknown;
  weight?: unknown;
  style?: unknown;
  format?: unknown;
}

interface FontSource {
  family?: unknown;
  provider?: unknown;
  variants?: unknown;
  files?: unknown;
}

function assertFontFile(family: string, file: FontFile): void {
  const url = typeof file.url === 'string' ? file.url : '';
  if (!url.startsWith('https://') || /[\s"'()<>]/.test(url)) {
    badRequest(`A file of ${family} has no valid https address.`);
  }
  if (typeof file.weight !== 'string' || !FONT_WEIGHT.test(file.weight)) {
    badRequest(`A file of ${family} needs a weight from 100 to 900.`);
  }
  if (typeof file.style !== 'string' || !FONT_STYLES.has(file.style)) {
    badRequest(`A file of ${family} must be normal or italic.`);
  }
  if (typeof file.format !== 'string' || !FONT_FORMATS.has(file.format)) {
    badRequest(`A file of ${family} must be WOFF2, WOFF, TTF or OTF.`);
  }
}

function assertGoogleVariants(family: string, source: FontSource): void {
  const variants = Array.isArray(source.variants) ? source.variants : [];
  if (
    variants.length === 0 ||
    variants.some((v) => typeof v !== 'string' || !FONT_VARIANT.test(v))
  ) {
    badRequest(`Choose the styles of ${family} to load (400, 700, 400i …).`);
  }
}

function assertCustomFiles(family: string, source: FontSource): void {
  const files = Array.isArray(source.files) ? (source.files as FontFile[]) : [];
  if (files.length === 0 || files.length > MAX_FONT_FILES) {
    badRequest(`Upload at least one file for ${family}.`);
  }
  files.forEach((file) => assertFontFile(family, file));
}

function assertFontSource(source: FontSource): void {
  const family = typeof source.family === 'string' ? source.family : '';
  if (!FONT_FAMILY.test(family)) {
    badRequest(`"${family}" is not a valid font family name.`);
  }
  if (source.provider === 'GOOGLE') {
    assertGoogleVariants(family, source);
  } else if (source.provider === 'CUSTOM') {
    assertCustomFiles(family, source);
  } else {
    badRequest(`${family} must come from Google Fonts or an upload.`);
  }
}

/**
 * The fonts a design system loads: Google Fonts families (with the styles to load) and custom
 * families uploaded to the media library (one file per weight and style).
 */
function assertFontSources(values: unknown): void {
  if (!Array.isArray(values) || values.length > MAX_FONT_SOURCES) {
    badRequest(`Load at most ${MAX_FONT_SOURCES} font families.`);
  }
  for (const source of values as FontSource[]) {
    assertFontSource(source);
  }
}
/** A token key becomes a CSS custom property name: letters, digits and dashes only. */
const TOKEN_KEY = /^[a-z\d][a-z\d-]{0,60}$/i;
/** A token value is a CSS value; nothing that could close the declaration or the rule. */
const TOKEN_VALUE = /^[^;{}<>]{1,300}$/;

function assertFlat(group: string, values: unknown): void {
  if (values === null || typeof values !== 'object' || Array.isArray(values)) {
    badRequest(`The ${group} tokens must be a list of name → value.`);
  }
  for (const [key, value] of Object.entries(values)) {
    if (!TOKEN_KEY.test(key) || typeof value !== 'string' || !TOKEN_VALUE.test(value)) {
      badRequest(`"${key}" in ${group} is not a valid token.`);
    }
  }
}

function assertColorModes(values: unknown): void {
  const modes = (values ?? {}) as Record<string, unknown>;
  for (const mode of Object.keys(modes)) {
    if (mode !== 'light' && mode !== 'dark') {
      badRequest('Colours are given for light and dark only.');
    }
    assertFlat(`${mode} colours`, modes[mode]);
  }
}

/**
 * Checks a design system's tokens: known groups only, and every name and value safe to write
 * into a stylesheet as a custom property.
 */
function assertTokens(tokens: Record<string, unknown>): void {
  for (const [group, values] of Object.entries(tokens)) {
    if (!TOKEN_GROUPS.has(group)) {
      badRequest(`"${group}" is not a design token group.`);
    }
    if (group === 'fontSources') {
      assertFontSources(values);
    } else if (group === 'colors') {
      assertColorModes(values);
    } else {
      assertFlat(group, values);
    }
  }
}

export const cmsDesignSystems = {
  list: (siteId: string) => CmsDesignSystemModel.find({ siteId }).sort({ name: 1 }).lean(),

  async get(id: string) {
    const design = await CmsDesignSystemModel.findById(id).lean();
    if (!design) notFound('Design system');
    return design;
  },

  create(input: CmsDesignSystemInput) {
    assertTokens(input.tokens);
    return CmsDesignSystemModel.create({ ...input, extraCss: input.extraCss ?? '' }).then((d) =>
      d.toObject(),
    );
  },

  async update(id: string, input: CmsDesignSystemInput) {
    assertTokens(input.tokens);
    const design = await CmsDesignSystemModel.findByIdAndUpdate(
      id,
      { name: input.name, tokens: input.tokens, extraCss: input.extraCss ?? '' },
      { new: true },
    ).lean();
    if (!design) notFound('Design system');
    return design;
  },

  async remove(id: string) {
    const result = await CmsDesignSystemModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) notFound('Design system');
    return true;
  },
};
