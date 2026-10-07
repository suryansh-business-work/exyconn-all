import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { SendPreview } from '../../../../../../src/pages/marketing/forms/send-campaign';
import { renderWithProviders } from '../../../../test-utils';

const gql = vi.hoisted(() => ({ preview: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCampaignPreviewQuery: (options: unknown) => gql.preview(options),
}));

const renderPreview = () =>
  renderWithProviders(<SendPreview campaignId="campaign-1" audienceListId="audience-1" />);

describe('SendPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the first recipient's copy exactly as the server will send it", () => {
    gql.preview.mockReturnValue({
      loading: false,
      data: {
        campaignPreview: {
          recipient: 'asha@acme.io',
          subject: 'Hi Asha',
          body: 'Dear Asha,\nSee you',
        },
      },
    });
    renderPreview();

    expect(gql.preview).toHaveBeenCalledWith({
      variables: { id: 'campaign-1', audienceListId: 'audience-1' },
    });
    expect(screen.getByText('Preview — as asha@acme.io will see it')).toBeInTheDocument();
    expect(screen.getByText('Hi Asha')).toBeInTheDocument();
    expect(screen.getByText(/Dear Asha,/)).toBeInTheDocument();
  });

  it('says it is rendering while the server works', () => {
    gql.preview.mockReturnValue({ loading: true, data: undefined });
    renderPreview();

    expect(screen.getByText('Rendering preview…')).toBeInTheDocument();
  });

  it('shows why the preview could not be rendered', () => {
    gql.preview.mockReturnValue({ loading: false, error: new Error('Unknown merge field') });
    renderPreview();

    expect(screen.getByRole('alert')).toHaveTextContent('Unknown merge field');
  });

  it('warns when the audience reaches nobody', () => {
    gql.preview.mockReturnValue({ loading: false, data: { campaignPreview: null } });
    renderPreview();

    expect(screen.getByRole('alert')).toHaveTextContent('This audience currently reaches nobody.');
  });
});
