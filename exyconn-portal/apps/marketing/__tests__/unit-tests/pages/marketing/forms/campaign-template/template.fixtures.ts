import { EditorMode } from '@exyconn/shell/graphql/generated';
import type { CampaignTemplateRow } from '../../../../../../src/pages/marketing/forms/campaign-template';

/** A saved campaign template, as the list and versions screens receive it. */
export function templateRow(overrides: Partial<CampaignTemplateRow> = {}): CampaignTemplateRow {
  return {
    __typename: 'CampaignTemplate',
    id: 'tpl-1',
    name: 'Welcome',
    category: 'General',
    description: '',
    editorMode: EditorMode.Visual,
    blocks: {},
    mjml: '<mjml><mj-body></mj-body></mjml>',
    version: 1,
    updatedByName: 'Asha Rao',
    updatedAt: '2026-09-02T09:30:00.000Z',
    ...overrides,
  };
}
