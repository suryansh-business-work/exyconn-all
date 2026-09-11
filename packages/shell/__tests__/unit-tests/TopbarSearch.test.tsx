import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ROLES } from '@/auth/roles';
import { MODULES } from '@/config/modules';
import { TopbarSearch } from '@/layout/PortalLayout/TopbarSearch';

vi.mock('@/hooks/useCrossAppNavigate', () => ({ useCrossAppNavigate: () => vi.fn() }));

const first = MODULES[0];

describe('the topbar search', () => {
  // Overriding `slotProps` without spreading the Autocomplete's own drops its `htmlInput`
  // slot — the input then shows nothing typed and filters nothing.
  it('keeps what is typed and lists the modules that match it', async () => {
    const user = userEvent.setup();
    render(<TopbarSearch roles={[ROLES.ADMIN]} />);

    const input = screen.getByRole('combobox');
    await user.type(input, first.label);

    expect(input).toHaveValue(first.label);
    expect(screen.getByRole('option', { name: first.label })).toBeInTheDocument();
  });
});
