import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BusinessInfoDrawer } from '../../../../../src/components/wa/chat/BusinessInfoDrawer';
import { renderWithProviders } from '../../../test-utils';
import { demoProfile } from '../wa-ui.fixtures';

const view = vi.hoisted(() => ({ compact: false }));

vi.mock('../../../../../src/theme/useWa', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useCompact: () => view.compact,
}));

afterEach(() => {
  view.compact = false;
});

describe('BusinessInfoDrawer', () => {
  it("shows the business's profile and every contact detail it has", async () => {
    const onClose = vi.fn();
    renderWithProviders(<BusinessInfoDrawer demo={demoProfile()} open onClose={onClose} />);
    const heading = await screen.findByRole('heading', { name: 'Business info' });
    expect(heading).toBeInTheDocument();
    expect(screen.getByText('City Clinic')).toBeInTheDocument();
    expect(screen.getByTitle('Verified business')).toBeInTheDocument();
    expect(screen.getByText('Business account')).toBeInTheDocument();
    expect(screen.getByText('A family clinic.')).toBeInTheDocument();
    const details = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(details.map((d) => d.textContent)).toEqual([
      'Clinic',
      'MG Road, Bengaluru',
      'Mon–Sat 9–6',
      '+91 80000 00000',
      'hello@clinic.example',
      'clinic.example',
    ]);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('leaves out the details the business has not filled in, and the badge when unverified', async () => {
    view.compact = true;
    const demo = demoProfile({}, { verified: false, phone: '', email: '', website: '', hours: '' });
    renderWithProviders(<BusinessInfoDrawer demo={demo} open onClose={vi.fn()} />);
    await screen.findByRole('heading', { name: 'Business info' });
    const details = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(details.map((d) => d.textContent)).toEqual(['Clinic', 'MG Road, Bengaluru']);
    expect(screen.queryByTitle('Verified business')).not.toBeInTheDocument();
  });

  it('renders nothing while closed', () => {
    renderWithProviders(<BusinessInfoDrawer demo={demoProfile()} open={false} onClose={vi.fn()} />);
    expect(screen.queryByRole('heading', { name: 'Business info' })).not.toBeInTheDocument();
  });
});
