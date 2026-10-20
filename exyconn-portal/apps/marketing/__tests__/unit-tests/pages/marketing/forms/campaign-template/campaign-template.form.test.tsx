import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { EditorMode } from '@exyconn/shell/graphql/generated';
import {
  CampaignTemplateForm,
  type TemplateContent,
} from '../../../../../../src/pages/marketing/forms/campaign-template';
import { renderWithProviders } from '../../../../test-utils';
import { answered } from '../../../../fixtures';
import { chooseOption, fill, optionsOf, press } from '../../../../form-helpers';
import { templateRow } from './template.fixtures';

const gql = vi.hoisted(() => ({ list: vi.fn(), save: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListCampaignTemplatesQuery: () => gql.list(),
  useSaveCampaignTemplateMutation: () => [gql.save],
}));

const CONTENT: TemplateContent = {
  editorMode: EditorMode.Visual,
  blocks: { rows: [] },
  mjml: '<mjml><mj-body>Hi</mj-body></mjml>',
};

const WELCOME = templateRow({
  id: 'tpl-1',
  name: 'Welcome',
  category: 'Onboarding',
  description: 'First email',
});

function renderTemplateForm() {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(
    <CampaignTemplateForm content={CONTENT} onDone={onDone} onCancel={onCancel} />,
  );
  return { onDone, onCancel };
}

describe('CampaignTemplateForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.list.mockReturnValue(answered({ listCampaignTemplates: [WELCOME] }));
    gql.save.mockResolvedValue({ data: { saveCampaignTemplate: WELCOME } });
  });

  it('offers a new template or a new version of each existing one', async () => {
    renderTemplateForm();

    expect(await optionsOf('Save as')).toEqual(['A new template', 'New version of “Welcome”']);
    expect(screen.getByLabelText(/^Category/)).toHaveValue('General');
    expect(screen.getByRole('button', { name: 'Save template' })).toBeInTheDocument();
  });

  it('offers only a new template before the list has loaded', async () => {
    gql.list.mockReturnValue({ data: undefined, loading: true });
    renderTemplateForm();

    expect(await optionsOf('Save as')).toEqual(['A new template']);
  });

  it('saves a new template with the studio design and the trimmed details', async () => {
    const { onDone } = renderTemplateForm();
    fill('Template name *', '  Autumn launch  ');
    fill('Category *', 'Promotion');
    fill('Description', 'Seasonal');
    fill('Version note', 'First cut');

    await press('Save template');

    expect(await screen.findByText('Template saved')).toBeInTheDocument();
    expect(gql.save).toHaveBeenCalledWith({
      variables: {
        id: null,
        input: {
          ...CONTENT,
          name: 'Autumn launch',
          category: 'Promotion',
          description: 'Seasonal',
          note: 'First cut',
        },
      },
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('fills in an existing template and saves the next version of it', async () => {
    const { onDone } = renderTemplateForm();

    await chooseOption('Save as', 'New version of “Welcome”');

    expect(screen.getByLabelText(/^Template name/)).toHaveValue('Welcome');
    expect(screen.getByLabelText(/^Category/)).toHaveValue('Onboarding');
    expect(screen.getByLabelText('Description')).toHaveValue('First email');
    await press('Save template');

    expect(
      await screen.findByText('Template updated — the previous version can be restored'),
    ).toBeInTheDocument();
    expect(gql.save).toHaveBeenCalledWith({
      variables: {
        id: 'tpl-1',
        input: {
          ...CONTENT,
          name: 'Welcome',
          category: 'Onboarding',
          description: 'First email',
          note: '',
        },
      },
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('needs a name and a category', async () => {
    renderTemplateForm();
    fill('Category *', '   ');

    await press('Save template');

    expect(await screen.findByText('Name the template')).toBeInTheDocument();
    expect(screen.getByText('Choose or type a category')).toBeInTheDocument();
    expect(gql.save).not.toHaveBeenCalled();
  });

  it('caps every field at its length', async () => {
    renderTemplateForm();
    fill('Template name *', 'n'.repeat(121));
    fill('Category *', 'c'.repeat(61));
    fill('Description', 'd'.repeat(501));
    fill('Version note', 'v'.repeat(201));

    await press('Save template');

    expect(await screen.findByText('Keep the name under 120 characters')).toBeInTheDocument();
    expect(screen.getByText('Keep the category under 60 characters')).toBeInTheDocument();
    expect(screen.getByText('Keep the description under 500 characters')).toBeInTheDocument();
    expect(screen.getByText('Keep the note under 200 characters')).toBeInTheDocument();
    expect(gql.save).not.toHaveBeenCalled();
  });

  it('accepts every field at its limit', async () => {
    renderTemplateForm();
    fill('Template name *', 'n'.repeat(120));
    fill('Category *', 'c'.repeat(60));
    fill('Description', 'd'.repeat(500));
    fill('Version note', 'v'.repeat(200));

    await press('Save template');

    expect(await screen.findByText('Template saved')).toBeInTheDocument();
  });

  it('reports a failed save and keeps the form open', async () => {
    gql.save.mockRejectedValue(new Error('A template with that name exists'));
    const { onDone } = renderTemplateForm();
    fill('Template name *', 'Welcome');

    await press('Save template');

    expect(await screen.findByText('A template with that name exists')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('falls back to a plain message when the failure has none', async () => {
    gql.save.mockRejectedValue('boom');
    renderTemplateForm();
    fill('Template name *', 'Welcome');

    await press('Save template');

    expect(await screen.findByText('The template could not be saved')).toBeInTheDocument();
  });

  it('hands Cancel back to the studio', async () => {
    const { onCancel } = renderTemplateForm();

    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(gql.save).not.toHaveBeenCalled();
  });
});
