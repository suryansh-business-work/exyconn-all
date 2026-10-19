import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PreviewPane } from '../../../../../../../src/pages/marketing/forms/campaign/design/PreviewPane';
import { renderWithProviders } from '../../../../../test-utils';
import { preview, previewState } from '../studio.fixtures';

vi.mock('@exyconn/code-editor', () => import('../code-editor-stub'));

const frame = () => screen.getByTitle<HTMLIFrameElement>('Email preview');

describe('PreviewPane', () => {
  it('shows the inbox line and the email in a locked-down frame at desktop width', () => {
    renderWithProviders(<PreviewPane state={previewState()} />);
    expect(screen.getByText('To: Asha')).toBeInTheDocument();
    expect(screen.getByText('Sample data')).toBeInTheDocument();
    expect(screen.getByText('Hi Asha')).toBeInTheDocument();
    expect(screen.getByText('Festive savings inside')).toBeInTheDocument();
    expect(frame()).toHaveAttribute('sandbox', '');
    expect(frame()).toHaveAttribute('srcdoc', '<p>Hi Asha</p>');
    expect(getComputedStyle(frame()).width).toBe('680px');
  });

  it('narrows the frame to a phone and back', async () => {
    renderWithProviders(<PreviewPane state={previewState()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Mobile' }));
    expect(getComputedStyle(frame()).width).toBe('375px');
    await userEvent.click(screen.getByRole('button', { name: 'Mobile' }));
    expect(getComputedStyle(frame()).width).toBe('375px');
    await userEvent.click(screen.getByRole('button', { name: 'Desktop' }));
    expect(getComputedStyle(frame()).width).toBe('680px');
  });

  it('shows the HTML read-only and the plain-text version', async () => {
    renderWithProviders(<PreviewPane state={previewState()} />);
    await userEvent.click(screen.getByRole('button', { name: 'HTML' }));
    const html = screen.getByLabelText('HTML output');
    expect(html).toHaveValue('<p>Hi Asha</p>');
    expect(html).toHaveAttribute('readonly');
    await userEvent.type(html, 'x');
    expect(html).toHaveValue('<p>Hi Asha</p>');
    await userEvent.click(screen.getByRole('button', { name: 'HTML' }));
    expect(screen.getByLabelText('HTML output')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Plain text' }));
    expect(screen.getByLabelText('Plain-text version')).toHaveValue('Hi Asha');
    expect(screen.getByLabelText('Plain-text version')).toHaveAttribute('readonly');
    await userEvent.click(screen.getByRole('button', { name: 'Email' }));
    expect(frame()).toBeInTheDocument();
  });

  it('names a real recipient by name or address, with placeholders for empty lines', () => {
    renderWithProviders(
      <PreviewPane
        state={previewState({
          preview: preview({
            subject: '',
            preheader: '',
            recipient: { kind: 'CONTACT', name: '', email: 'asha@acme.in' },
          }),
        })}
      />,
    );
    expect(screen.getByText('To: asha@acme.in')).toBeInTheDocument();
    expect(screen.queryByText('Sample data')).not.toBeInTheDocument();
    expect(screen.getByText('(no subject)')).toBeInTheDocument();
    expect(screen.getByText('(no preview text)')).toBeInTheDocument();
  });

  it('lists compile errors and variables with nothing to show', () => {
    renderWithProviders(
      <PreviewPane
        state={previewState({
          error: 'The preview could not be built.',
          preview: preview({
            issues: [{ line: 3, message: 'Unclosed tag' }],
            missingVariables: ['contact.lastName', 'company.city'],
          }),
        })}
      />,
    );
    const alerts = screen.getAllByRole('alert').map((alert) => alert.textContent);
    expect(alerts).toEqual([
      'The preview could not be built.',
      'Line 3: Unclosed tag',
      'Empty for this recipient, with no fallback: contact.lastName, company.city. Add a fallback like {{contact.firstName|there}}.',
    ]);
  });

  it('shows progress and dims the old render while updating', () => {
    renderWithProviders(<PreviewPane state={previewState({ updating: true })} />);
    expect(screen.getByRole('progressbar', { name: 'Updating preview…' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar').closest('[aria-busy]')).toHaveAttribute(
      'aria-busy',
      'true',
    );
  });

  it('says it is building the first preview, or that there is nothing yet', () => {
    const { rerender } = renderWithProviders(
      <PreviewPane state={{ preview: null, updating: true, error: null }} />,
    );
    expect(screen.getByText('Building the preview…')).toBeInTheDocument();
    rerender(<PreviewPane state={{ preview: null, updating: false, error: null }} />);
    expect(screen.getByText('Nothing to preview yet.')).toBeInTheDocument();
    expect(screen.queryByText(/^To:/)).not.toBeInTheDocument();
    rerender(<PreviewPane state={previewState({ preview: preview({ html: '' }) })} />);
    expect(screen.getByText('Nothing to preview yet.')).toBeInTheDocument();
  });
});
