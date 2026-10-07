import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test-utils';
import { readOnly, signed, unsigned } from './helpers/policies';
import { PolicyCard } from '../../../../src/pages/employee/PolicyCard';

vi.mock('@exyconn/shell/hooks/useSettings', () => import('./helpers/settings'));

describe('PolicyCard', () => {
  it('asks for a signature on a policy that needs one, naming the version', async () => {
    const onOpen = vi.fn();
    renderWithProviders(<PolicyCard policy={unsigned} onOpen={onOpen} />);

    expect(screen.getByRole('heading', { name: 'Code of conduct' })).toBeInTheDocument();
    expect(screen.getByText('How we treat each other.')).toBeInTheDocument();
    expect(screen.getByText('v2 · needs your signature')).toBeInTheDocument();
    expect(screen.getByText('Effective on 2026-01-01')).toBeInTheDocument();

    const button = screen.getByRole('button', { name: 'Read and sign' });
    expect(button).toHaveClass('MuiButton-contained');
    expect(screen.getByTestId('DrawIcon')).toBeInTheDocument();
    await userEvent.click(button);
    expect(onOpen).toHaveBeenCalledWith(unsigned);
  });

  it('says when a signed policy was signed', () => {
    renderWithProviders(<PolicyCard policy={signed} onOpen={vi.fn()} />);
    expect(screen.getByText('v3')).toBeInTheDocument();
    expect(screen.getByText('Signed on 2026-02-10')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Read' })).toHaveClass('MuiButton-text');
    expect(screen.getByTestId('CheckCircleIcon')).toBeInTheDocument();
  });

  it('says only "Signed" when the signing date is missing', () => {
    renderWithProviders(
      <PolicyCard policy={{ ...signed, acknowledgedAt: null }} onOpen={vi.fn()} />,
    );
    expect(screen.getByText('Signed')).toBeInTheDocument();
  });

  it('offers a plain read on a policy that asks for no signature', async () => {
    const onOpen = vi.fn();
    renderWithProviders(<PolicyCard policy={readOnly} onOpen={onOpen} />);

    expect(screen.getByText('v1')).toBeInTheDocument();
    expect(screen.getByText('Effective on 2026-01-01')).toBeInTheDocument();
    expect(screen.queryByTestId('DrawIcon')).toBeNull();
    expect(screen.queryByTestId('CheckCircleIcon')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Read' }));
    expect(onOpen).toHaveBeenCalledWith(readOnly);
  });
});
