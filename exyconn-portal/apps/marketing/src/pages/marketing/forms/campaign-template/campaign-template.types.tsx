import { z } from 'zod';
import type { CampaignTemplateFieldsFragment, EditorMode } from '@exyconn/shell/graphql/generated';

export type CampaignTemplateRow = CampaignTemplateFieldsFragment;

/** What a template is made from: the design and its MJML, as the studio holds them. */
export interface TemplateContent {
  editorMode: EditorMode;
  blocks: unknown;
  mjml: string;
}

export const campaignTemplateSchema = z.object({
  /** Empty saves a new template; an id saves a new version of that one. */
  templateId: z.string(),
  name: z
    .string()
    .trim()
    .min(1, 'Name the template')
    .max(120, 'Keep the name under 120 characters'),
  category: z
    .string()
    .trim()
    .min(1, 'Choose or type a category')
    .max(60, 'Keep the category under 60 characters'),
  description: z.string().trim().max(500, 'Keep the description under 500 characters'),
  note: z.string().trim().max(200, 'Keep the note under 200 characters'),
});

export type CampaignTemplateValues = z.infer<typeof campaignTemplateSchema>;

export const EMPTY_TEMPLATE: CampaignTemplateValues = {
  templateId: '',
  name: '',
  category: 'General',
  description: '',
  note: '',
};
