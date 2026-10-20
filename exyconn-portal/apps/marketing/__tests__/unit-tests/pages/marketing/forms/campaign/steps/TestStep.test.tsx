import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestStep } from '../../../../../../../src/pages/marketing/forms/campaign/steps/TestStep';
import { renderWithProviders } from '../../../../../test-utils';
import { CONTACT, checksState, previewState } from '../studio.fixtures';

vi.mock('@exyconn/code-editor', () => import('../code-editor-stub'));
vi.mock(
  '../../../../../../../src/pages/marketing/forms/campaign-test',
  () => import('../form-stubs'),
);

describe('TestStep', () => {
  it('waits for a saved campaign before it can be tested', () => {
    renderWithProviders(
      <TestStep
        campaignId={null}
        preview={previewState()}
        previewRecord={null}
        checks={checksState()}
        save={vi.fn()}
      />,
    );
    expect(
      screen.getByText('Name the campaign so it can be saved; then it can be tested.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Test form' })).not.toBeInTheDocument();
  });

  it('offers a test send as the previewed recipient, the checks and the preview', async () => {
    const save = vi.fn().mockResolvedValue(true);
    const run = vi.fn();
    renderWithProviders(
      <TestStep
        campaignId="campaign-1"
        preview={previewState()}
        previewRecord={CONTACT}
        checks={checksState({ run })}
        save={save}
      />,
    );
    expect(screen.getByRole('region', { name: 'Test form' })).toHaveTextContent(
      '{"campaignId":"campaign-1","record":"contact-1"}',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Send test' }));
    expect(save).toHaveBeenCalledTimes(1);
    expect(screen.getByText('SPF is set up')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Run checks' }));
    expect(run).toHaveBeenCalledTimes(1);
    expect(screen.getByTitle('Email preview')).toBeInTheDocument();
  });

  it('shows no verdict before the checks have a report', () => {
    renderWithProviders(
      <TestStep
        campaignId="campaign-1"
        preview={previewState()}
        previewRecord={null}
        checks={checksState({ report: null, loading: true })}
        save={vi.fn()}
      />,
    );
    expect(screen.queryByText('Ready to send.')).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Test form' })).toHaveTextContent('"record":null');
  });
});
