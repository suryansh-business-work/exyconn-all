import { z } from 'zod';
import { CampaignTemplateModel, CampaignTemplateVersionModel } from './campaign-template.model';
import { EDITOR_MODES } from './marketing.model';
import { EmailTemplateModel } from '../email/email-template.model';
import { loadFragments } from '../email/email.service';
import { expandFragments } from '../email/email.render';
import { isDuplicateKeyOnly } from './marketing.suppression';
import { badRequest, notFound } from '../../utils/errors';
import { logger } from '../../utils/logger';

export const templateInputSchema = z.object({
  name: z.string().trim().min(1, 'Name the template.').max(120),
  category: z.string().trim().max(60).default('General'),
  description: z.string().trim().max(500).default(''),
  editorMode: z.enum(EDITOR_MODES).default('VISUAL'),
  blocks: z.union([z.record(z.string(), z.unknown()), z.array(z.unknown()).max(200)]).default([]),
  mjml: z.string().trim().min(1, 'The template has no content.').max(500_000),
  note: z.string().trim().max(200).default(''),
});

export type TemplateInput = z.infer<typeof templateInputSchema>;

function parseTemplate(input: unknown): TemplateInput {
  const parsed = templateInputSchema.safeParse(input);
  if (!parsed.success) {
    badRequest(parsed.error.issues[0].message);
  }
  return parsed.data;
}

const nameTaken = (name: string): never => badRequest(`A template named "${name}" already exists.`);

async function addVersion(
  templateId: string,
  version: number,
  input: TemplateInput,
  actorName: string,
) {
  await CampaignTemplateVersionModel.create({
    templateId,
    version,
    editorMode: input.editorMode,
    blocks: input.blocks,
    mjml: input.mjml,
    note: input.note,
    createdByName: actorName,
  });
}

/** Saves a template; an update keeps the old content as a version Restore can return to. */
export async function saveTemplate(id: string | null, raw: unknown, actorName: string) {
  const input = parseTemplate(raw);
  const { note, ...content } = input;
  try {
    if (!id) {
      const created = await CampaignTemplateModel.create({
        ...content,
        version: 1,
        updatedByName: actorName,
      });
      await addVersion(created._id.toHexString(), 1, input, actorName);
      return created.toObject();
    }
    const updated = await CampaignTemplateModel.findByIdAndUpdate(
      id,
      { $set: { ...content, updatedByName: actorName }, $inc: { version: 1 } },
      { new: true, runValidators: true },
    ).lean();
    if (!updated) {
      return notFound('Template');
    }
    await addVersion(id, updated.version, { ...input, note }, actorName);
    return updated;
  } catch (err) {
    if (isDuplicateKeyOnly(err)) {
      return nameTaken(input.name);
    }
    throw err;
  }
}

/** The first free copy name, tried in order: "(copy)", then "(copy 2)" up to "(copy 99)". */
async function freeCopyName(name: string, n = 1): Promise<string> {
  if (n >= 100) {
    return badRequest('Too many copies of this template exist already.');
  }
  const candidate = n === 1 ? `${name} (copy)` : `${name} (copy ${n})`;
  if (await CampaignTemplateModel.exists({ name: candidate })) {
    return freeCopyName(name, n + 1);
  }
  return candidate;
}

export async function duplicateTemplate(id: string, actorName: string) {
  const source = await CampaignTemplateModel.findById(id).lean();
  if (!source) {
    return notFound('Template');
  }
  return saveTemplate(
    null,
    {
      name: await freeCopyName(source.name),
      category: source.category,
      description: source.description,
      editorMode: source.editorMode,
      blocks: source.blocks,
      mjml: source.mjml,
      note: `Copied from "${source.name}"`,
    },
    actorName,
  );
}

/** Makes an old version current again — as a new version, so nothing is lost. */
export async function restoreTemplateVersion(
  templateId: string,
  version: number,
  actorName: string,
) {
  const [template, saved] = await Promise.all([
    CampaignTemplateModel.findById(templateId).lean(),
    CampaignTemplateVersionModel.findOne({ templateId, version }).lean(),
  ]);
  if (!template || !saved) {
    return notFound('Template version');
  }
  return saveTemplate(
    templateId,
    {
      name: template.name,
      category: template.category,
      description: template.description,
      editorMode: saved.editorMode,
      blocks: saved.blocks,
      mjml: saved.mjml,
      note: `Restored version ${version}`,
    },
    actorName,
  );
}

export async function deleteTemplate(id: string): Promise<boolean> {
  const removed = await CampaignTemplateModel.findByIdAndDelete(id).lean();
  if (!removed) {
    return notFound('Template');
  }
  return true;
}

/**
 * Tech > Email templates offered as starting points, their fragments expanded so the copy a
 * campaign takes is complete. The campaign then owns its copy; the Tech template is untouched.
 */
export async function techTemplates() {
  const [rows, fragments] = await Promise.all([
    EmailTemplateModel.find({ isActive: true }).select('key name mjml').sort({ name: 1 }).lean(),
    loadFragments(),
  ]);
  return rows.flatMap((row) => {
    try {
      return [{ key: row.key, name: row.name, mjml: expandFragments(row.mjml, fragments) }];
    } catch (err) {
      // A Tech template with a broken fragment cannot be a starting point; it is left out.
      logger.warn({ err }, `Tech template "${row.key}" could not be expanded`);
      return [];
    }
  });
}
