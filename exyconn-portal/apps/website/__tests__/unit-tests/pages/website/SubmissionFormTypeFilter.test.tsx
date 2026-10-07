import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubmissionFormTypeFilter } from '../../../../src/pages/website/SubmissionFormTypeFilter';
import { renderWithProviders } from '../../test-utils';

const gql = vi.hoisted(() => ({ formTypes: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useWebsiteFormTypesQuery: () => gql.formTypes(),
}));

function renderFilter(value: string) {
  const onChange = vi.fn();
  renderWithProviders(<SubmissionFormTypeFilter value={value} onChange={onChange} />);
  return onChange;
}

/** MUI paints the chosen chip filled and the others outlined. */
const isFilled = (name: string) =>
  screen.getByRole('button', { name }).classList.contains('MuiChip-filled');

describe('SubmissionFormTypeFilter', () => {
  beforeEach(() => {
    gql.formTypes.mockReturnValue({ data: { websiteFormTypes: ['contact', 'careers'] } });
  });

  it('offers every form the server accepts, plus all forms', () => {
    renderFilter('');

    expect(screen.getAllByRole('button').map((chip) => chip.textContent)).toEqual([
      'All forms',
      'contact',
      'careers',
    ]);
    expect(isFilled('All forms')).toBe(true);
    expect(isFilled('contact')).toBe(false);
  });

  it('scopes the inbox to a form when its chip is picked', async () => {
    const onChange = renderFilter('');

    await userEvent.click(screen.getByRole('button', { name: 'careers' }));

    expect(onChange).toHaveBeenCalledWith('careers');
  });

  it('clears the scope when the chosen form is picked again or all forms is picked', async () => {
    const onChange = renderFilter('contact');
    expect(isFilled('contact')).toBe(true);
    expect(isFilled('All forms')).toBe(false);

    await userEvent.click(screen.getByRole('button', { name: 'contact' }));
    await userEvent.click(screen.getByRole('button', { name: 'All forms' }));

    expect(onChange.mock.calls).toEqual([[''], ['']]);
  });

  it('offers only all forms until the list arrives', () => {
    gql.formTypes.mockReturnValue({ data: undefined });
    renderFilter('');

    expect(screen.getAllByRole('button')).toHaveLength(1);
  });
});
