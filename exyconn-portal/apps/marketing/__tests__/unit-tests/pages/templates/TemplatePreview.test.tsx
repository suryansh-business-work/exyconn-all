import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { TemplatePreview } from '../../../../src/pages/templates/TemplatePreview';
import { renderWithProviders } from '../../test-utils';
import { templateRow } from '../marketing/forms/campaign-template/template.fixtures';

const preview = vi.hoisted(() => ({
  hook: vi.fn(),
  state: { preview: null, updating: true, error: null },
}));

vi.mock('../../../../src/pages/marketing/forms/campaign/design/useCampaignPreview', () => ({
  useCampaignPreview: (input: unknown) => {
    preview.hook(input);
    return preview.state;
  },
}));
vi.mock('../../../../src/pages/marketing/forms/campaign/design/PreviewPane', () => ({
  PreviewPane: ({ state }: Readonly<{ state: unknown }>) => (
    <output aria-label="preview state">{JSON.stringify(state)}</output>
  ),
}));

describe('TemplatePreview', () => {
  it('renders the template through the campaign preview, with sample sender details', () => {
    const template = templateRow({
      name: 'Autumn launch',
      description: 'Our new range',
      mjml: '<mjml><mj-body>Hi</mj-body></mjml>',
    });
    renderWithProviders(<TemplatePreview template={template} />);

    expect(preview.hook).toHaveBeenCalledWith({
      campaignName: 'Autumn launch',
      senderName: 'Your team',
      subject: 'Autumn launch',
      preheader: 'Our new range',
      mjml: '<mjml><mj-body>Hi</mj-body></mjml>',
    });
    expect(screen.getByRole('status', { name: 'preview state' })).toHaveTextContent(
      JSON.stringify(preview.state),
    );
  });

  it('translates the sample sender name', () => {
    renderWithProviders(<TemplatePreview template={templateRow()} />, {
      messages: { 'Your team': 'Votre équipe' },
      locale: 'fr',
    });

    expect(preview.hook).toHaveBeenLastCalledWith(
      expect.objectContaining({ senderName: 'Votre équipe' }),
    );
  });
});
