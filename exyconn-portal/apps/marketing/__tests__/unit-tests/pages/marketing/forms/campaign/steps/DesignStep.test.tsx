import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UseFormReturn } from 'react-hook-form';
import { EditorMode } from '@exyconn/shell/graphql/generated';
import { DesignStep } from '../../../../../../../src/pages/marketing/forms/campaign/steps/DesignStep';
import type { CampaignStudioValues } from '../../../../../../../src/pages/marketing/forms/campaign/campaign.types';
import {
  DEFAULT_SETTINGS,
  designToMjml,
  newBlock,
  type Design,
} from '../../../../../../../src/pages/marketing/forms/campaign/design/blocks';
import { renderWithProviders } from '../../../../../test-utils';
import { StudioFormHarness } from '../form-harness';
import { previewState, studioOptions } from '../studio.fixtures';

const gql = vi.hoisted(() => ({ saved: vi.fn(), tech: vi.fn() }));

vi.mock('@exyconn/code-editor', () => import('../code-editor-stub'));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListCampaignTemplatesQuery: () => gql.saved(),
  useTechEmailTemplateOptionsQuery: () => gql.tech(),
}));
vi.mock(
  '../../../../../../../src/pages/marketing/forms/campaign-template',
  () => import('../form-stubs'),
);

const DESIGN: Design = {
  settings: { ...DEFAULT_SETTINGS },
  blocks: [{ ...newBlock('header'), title: 'Hello' } as Design['blocks'][number]],
};
const PICKED_BLOCKS = [{ ...newBlock('text'), content: 'From template' }];

function renderStep(values: Partial<CampaignStudioValues> = {}) {
  let form: UseFormReturn<CampaignStudioValues> | undefined;
  renderWithProviders(
    <StudioFormHarness
      values={{
        editorMode: EditorMode.Visual,
        design: DESIGN,
        mjml: designToMjml(DESIGN),
        ...values,
      }}
      onForm={(value) => {
        form = value;
      }}
    >
      <DesignStep options={studioOptions()} preview={previewState()} />
    </StudioFormHarness>,
  );
  return () => form as UseFormReturn<CampaignStudioValues>;
}

/** Answers the open confirmation dialog with its confirm or cancel button. */
async function answer(confirmText: string | 'Cancel') {
  const dialog = await screen.findByRole('dialog');
  await userEvent.click(within(dialog).getByRole('button', { name: confirmText }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
}

const modeButton = (name: 'Visual' | 'MJML code') => screen.getByRole('button', { name });

describe('DesignStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.saved.mockReturnValue({
      data: {
        listCampaignTemplates: [
          {
            id: 't1',
            name: 'Digest',
            category: 'Newsletters',
            description: '',
            editorMode: EditorMode.Visual,
            blocks: { blocks: PICKED_BLOCKS },
            mjml: '<mjml>t1</mjml>',
            version: 1,
            updatedByName: '',
            updatedAt: '',
          },
        ],
      },
      loading: false,
    });
    gql.tech.mockReturnValue({
      data: {
        techEmailTemplateOptions: [{ key: 'welcome', name: 'Welcome', mjml: '<mjml>w</mjml>' }],
      },
    });
  });

  it('edits blocks visually beside the preview and rebuilds the MJML', () => {
    const form = renderStep();
    expect(modeButton('Visual')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTitle('Email preview')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Heading'), { target: { value: 'Welcome' } });
    expect(form().getValues('design').blocks[0]).toMatchObject({ title: 'Welcome' });
    expect(form().getValues('mjml')).toContain('>Welcome</mj-text>');
  });

  it('opens a missing design as the starter email', () => {
    renderStep({ design: undefined });
    expect(screen.getByRole('button', { name: /^Header/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Footer with unsubscribe/ })).toBeInTheDocument();
  });

  it('switches to code after confirming, keeping the MJML', async () => {
    const form = renderStep();
    const mjml = form().getValues('mjml');
    await userEvent.click(modeButton('MJML code'));
    expect(screen.getByText('Switch to code?')).toBeInTheDocument();
    await answer('Switch');
    expect(form().getValues('editorMode')).toBe(EditorMode.Code);
    expect(screen.getByLabelText('MJML source')).toHaveValue(mjml);
  });

  it('stays in the visual editor when the switch is cancelled', async () => {
    const form = renderStep();
    await userEvent.click(modeButton('MJML code'));
    await answer('Cancel');
    expect(form().getValues('editorMode')).toBe(EditorMode.Visual);
    expect(screen.queryByLabelText('MJML source')).not.toBeInTheDocument();
  });

  it('does nothing when the current mode is chosen again', async () => {
    renderStep();
    await userEvent.click(modeButton('Visual'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('rebuilds the MJML from the blocks when going back to visual', async () => {
    const form = renderStep({ editorMode: EditorMode.Code, mjml: '<mjml>hand written</mjml>' });
    await userEvent.click(modeButton('Visual'));
    expect(screen.getByText(/Changes made in code will be lost/)).toBeInTheDocument();
    await answer('Switch');
    expect(form().getValues('editorMode')).toBe(EditorMode.Visual);
    expect(form().getValues('mjml')).toBe(designToMjml(DESIGN));
  });

  it('rebuilds from the starter email when a code campaign has no design', async () => {
    const form = renderStep({ editorMode: EditorMode.Code, design: undefined, mjml: '<mjml/>' });
    await userEvent.click(modeButton('Visual'));
    await answer('Switch');
    expect(form().getValues('design').blocks).toHaveLength(4);
  });

  it('replaces the email with a visual template after confirming', async () => {
    const form = renderStep({ editorMode: EditorMode.Code });
    await userEvent.click(screen.getByRole('button', { name: 'Start from template' }));
    expect(screen.getByRole('heading', { name: 'Start from a template' })).toBeInTheDocument();
    const [useDigest] = screen.getAllByRole('button', { name: 'Use' });
    await userEvent.click(useDigest);
    await answer('Use template');
    expect(form().getValues('editorMode')).toBe(EditorMode.Visual);
    expect(form().getValues('design').blocks).toEqual(PICKED_BLOCKS);
    expect(form().getValues('mjml')).toContain('From template');
    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: 'Start from a template' }),
      ).not.toBeInTheDocument(),
    );
  });

  it('takes a Tech > Email template as code', async () => {
    const form = renderStep();
    await userEvent.click(screen.getByRole('button', { name: 'Start from template' }));
    const buttons = screen.getAllByRole('button', { name: 'Use' });
    await userEvent.click(buttons[buttons.length - 1]);
    await answer('Use template');
    expect(form().getValues(['editorMode', 'mjml'])).toEqual([EditorMode.Code, '<mjml>w</mjml>']);
    expect(form().getValues('design')).toEqual(DESIGN);
  });

  it('keeps the email and the picker open when the replacement is cancelled', async () => {
    const form = renderStep();
    await userEvent.click(screen.getByRole('button', { name: 'Start from template' }));
    await userEvent.click(screen.getAllByRole('button', { name: 'Use' })[0]);
    const confirmDialog = await screen.findByText('Replace this email?');
    await userEvent.click(
      within(confirmDialog.closest('[role="dialog"]') as HTMLElement).getByRole('button', {
        name: 'Cancel',
      }),
    );
    expect(form().getValues('design')).toEqual(DESIGN);
    expect(
      await screen.findByRole('heading', { name: 'Start from a template' }),
    ).toBeInTheDocument();
    await userEvent.click(await screen.findByRole('button', { name: 'Close' }));
    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: 'Start from a template' }),
      ).not.toBeInTheDocument(),
    );
  });

  it('saves the current content as a template', async () => {
    renderStep();
    await userEvent.click(screen.getByRole('button', { name: 'Save as template' }));
    const content = JSON.parse(
      screen.getByRole('region', { name: 'Template form' }).firstChild?.textContent ?? '{}',
    );
    expect(content).toEqual({
      editorMode: EditorMode.Visual,
      blocks: JSON.parse(JSON.stringify(DESIGN)),
      mjml: designToMjml(DESIGN),
    });
    await userEvent.click(screen.getByRole('button', { name: 'Template saved' }));
    await waitFor(() =>
      expect(screen.queryByRole('region', { name: 'Template form' })).not.toBeInTheDocument(),
    );
  });

  it('closes the save-as-template panel on cancel or close', async () => {
    renderStep();
    await userEvent.click(screen.getByRole('button', { name: 'Save as template' }));
    await userEvent.click(screen.getByRole('button', { name: 'Template cancelled' }));
    await waitFor(() =>
      expect(screen.queryByRole('region', { name: 'Template form' })).not.toBeInTheDocument(),
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Save as template' }));
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() =>
      expect(screen.queryByRole('region', { name: 'Template form' })).not.toBeInTheDocument(),
    );
  });
});
