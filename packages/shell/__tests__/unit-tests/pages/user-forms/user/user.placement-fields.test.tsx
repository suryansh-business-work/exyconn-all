import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import type { MockLink } from '@apollo/client/testing';
import { OrgMasterOptionsDocument } from '@/graphql/generated';
import { PlacementFields } from '@/pages/user-forms/user/user.placement-fields';
import { PlaceOfEmploymentFields } from '@/pages/user-forms/user/user.place-fields';
import { toFormValues } from '@/pages/user-forms/user';
import type { UserRow } from '@/pages/user-forms/user';
import { renderWithProviders } from '../../../test-utils';
import { FORM_TIMEOUT, SLOW } from '../slow';
import { FormHarness } from '../../../components/form/formHarness';
import { makeUserRow } from './userFixtures';

const coded = (typename: string, code: string, name: string, active = true) => ({
  __typename: typename,
  id: `${typename}-${code}`,
  name,
  code,
  active,
});

const mastersMock: MockLink.MockedResponse = {
  request: { query: OrgMasterOptionsDocument },
  result: {
    data: {
      listLocations: [
        coded('Location', 'PUN', 'Pune'),
        coded('Location', 'OLD', 'Old office', false),
      ],
      listTeams: [
        { __typename: 'Team', id: 't1', name: 'Talent', department: 'People', active: true },
        { __typename: 'Team', id: 't2', name: 'Floaters', department: '', active: true },
      ],
      listGrades: [coded('Grade', 'G4', 'Senior')],
      listEmploymentTypes: [coded('EmploymentType', 'FT', 'Full time')],
      listShifts: [{ ...coded('Shift', 'DAY', 'Day'), startTime: '09:00', endTime: '18:00' }],
    },
  },
};

function renderPlacement(row: Partial<UserRow>, mocks: MockLink.MockedResponse[] = [mastersMock]) {
  renderWithProviders(
    <FormHarness defaultValues={toFormValues(makeUserRow(row), null, 'INR')}>
      <PlacementFields />
    </FormHarness>,
    { mocks },
  );
}

const field = (label: string) => screen.getByRole('combobox', { name: label });

describe('PlacementFields', () => {
  it(
    'labels each master the way somebody chooses between them',
    async () => {
      renderPlacement({});

      await waitFor(() => expect(field('Location')).toHaveValue('Pune (PUN)'), SLOW);
      expect(field('Team')).toHaveValue('Talent · People');
      expect(field('Grade')).toHaveValue('Senior (G4)');
      expect(field('Employment type')).toHaveValue('Full time (FT)');
      expect(field('Shift')).toHaveValue('Day (09:00–18:00)');
    },
    FORM_TIMEOUT,
  );

  it(
    'names a team without a department by itself, and does not offer a retired master',
    async () => {
      renderPlacement({ teamName: 'Floaters', locationCode: 'OLD' });

      await waitFor(() => expect(field('Team')).toHaveValue('Floaters'), SLOW);
      expect(field('Location')).toHaveValue('');
    },
    FORM_TIMEOUT,
  );

  it(
    'offers only "Not set" while the masters have not loaded',
    () => {
      renderPlacement({ locationCode: '', shiftCode: 'DAY' }, []);

      expect(field('Location')).toHaveValue('Not set');
      expect(field('Shift')).toHaveValue('');
    },
    FORM_TIMEOUT,
  );
});

describe('PlaceOfEmploymentFields', () => {
  it(
    "follows the company's country when none is set, and names a set one",
    () => {
      renderWithProviders(
        <FormHarness defaultValues={toFormValues(makeUserRow({ country: '' }), null, 'INR')}>
          <PlaceOfEmploymentFields />
        </FormHarness>,
      );
      expect(field('Country of employment')).toHaveValue("Company's country");
      expect(screen.getByLabelText('City of employment')).toHaveValue('Pune');
      expect(screen.getByLabelText('State / region of employment')).toHaveValue('Maharashtra');
    },
    FORM_TIMEOUT,
  );

  it(
    'shows the stored country by name',
    () => {
      renderWithProviders(
        <FormHarness defaultValues={toFormValues(makeUserRow({ country: 'IN' }), null, 'INR')}>
          <PlaceOfEmploymentFields />
        </FormHarness>,
      );
      expect(field('Country of employment')).toHaveValue('India');
    },
    FORM_TIMEOUT,
  );
});
