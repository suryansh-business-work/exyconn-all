import { badRequest, notFound } from '../../utils/errors';
import { CmsDesignSystemModel } from './models';

export interface CmsDesignSystemInput {
  siteId: string;
  name: string;
  tokens: Record<string, unknown>;
  extraCss?: string | null;
}

const TOKEN_GROUPS = new Set(['colors', 'fonts', 'radii', 'shadows', 'spacing']);
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

/**
 * Checks a design system's tokens: known groups only, and every name and value safe to write
 * into a stylesheet as a custom property.
 */
function assertTokens(tokens: Record<string, unknown>): void {
  for (const [group, values] of Object.entries(tokens)) {
    if (!TOKEN_GROUPS.has(group)) {
      badRequest(`"${group}" is not a design token group.`);
    }
    if (group === 'colors') {
      const modes = (values ?? {}) as Record<string, unknown>;
      for (const mode of Object.keys(modes)) {
        if (mode !== 'light' && mode !== 'dark') {
          badRequest('Colours are given for light and dark only.');
        }
        assertFlat(`${mode} colours`, modes[mode]);
      }
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
