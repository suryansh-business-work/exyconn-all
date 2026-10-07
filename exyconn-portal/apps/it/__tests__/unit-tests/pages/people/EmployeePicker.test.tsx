import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmployeePicker } from '../../../../src/pages/people/EmployeePicker';
import { renderWithProviders, useCurrentUrl } from '../../test-utils';

const gql = vi.hoisted(() => ({ assignees: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListAssetAssigneesQuery: () => gql.assignees(),
}));

const people = [
  { __typename: 'AssetAssignee', id: 'u1', name: 'Asha Rao', email: 'asha@exyconn.test' },
  { __typename: 'AssetAssignee', id: 'u2', name: 'Ravi Kumar', email: 'ravi@exyconn.test' },
];

function UrlProbe() {
  return <output aria-label="current url">{useCurrentUrl()}</output>;
}

function renderPicker(selectedId: string, route = '/it/people') {
  renderWithProviders(
    <>
      <EmployeePicker selectedId={selectedId} />
      <UrlProbe />
    </>,
    { route },
  );
}

const url = () => screen.getByLabelText('current url').textContent;

describe('EmployeePicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.assignees.mockReturnValue({ data: { listAssetAssignees: people }, loading: false });
  });

  it('shows the selected employee by name and email', () => {
    renderPicker('u1');

    expect(screen.getByRole('combobox', { name: 'Employee' })).toHaveValue(
      'Asha Rao (asha@exyconn.test)',
    );
  });

  it('starts empty when the selected id is not one of the people', () => {
    renderPicker('someone-else');

    expect(screen.getByRole('combobox', { name: 'Employee' })).toHaveValue('');
  });

  it('opens the profile of the employee picked', async () => {
    renderPicker('u1');

    await userEvent.click(screen.getByRole('combobox', { name: 'Employee' }));
    await userEvent.click(
      await screen.findByRole('option', { name: 'Ravi Kumar (ravi@exyconn.test)' }),
    );

    expect(url()).toBe('/it/people/u2');
  });

  it('goes back to the people page when the choice is cleared', async () => {
    renderPicker('u1', '/it/people/u1');
    expect(url()).toBe('/it/people/u1');

    await userEvent.clear(screen.getByRole('combobox', { name: 'Employee' }));

    expect(url()).toBe('/it/people');
  });

  it('copes with the people list still loading', () => {
    gql.assignees.mockReturnValue({ data: undefined, loading: true });
    renderPicker('u1');

    expect(screen.getByRole('combobox', { name: 'Employee' })).toHaveValue('');
  });
});
