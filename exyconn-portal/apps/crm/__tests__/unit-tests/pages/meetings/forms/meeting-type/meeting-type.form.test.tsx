import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  MeetingTypeForm,
  toMeetingTypeValues,
  type MeetingTypeRow,
} from '../../../../../../src/pages/meetings/forms/meeting-type';
import { renderWithProviders } from '../../../../test-utils';
import { press } from '../../../../form-helpers';
import { meetingTypeRow } from '../../meetings-fixtures';

/** A field's label as written, or followed by the red star a required field adds. */
function labelled(label: string | RegExp): RegExp {
  if (label instanceof RegExp) {
    return label;
  }
  const escaped = label.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
  return new RegExp(String.raw`^${escaped}\s*\*?$`);
}

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateMeetingTypeMutation: () => [gql.create],
  useUpdateMeetingTypeMutation: () => [gql.update],
}));

vi.mock('@exyconn/shell/components/form/rhf', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/components/form/rhf')>()),
  RhfTimePicker: (await import('./time-field-stub')).TimeFieldStub,
}));

const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;

function renderForm(initial: MeetingTypeRow | null = null) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(<MeetingTypeForm initial={initial} onDone={onDone} onCancel={onCancel} />);
  return { onDone, onCancel };
}

/** Sets a text field in one change, as a paste would; typing key by key is slow here. */
function fillField(label: string, text: string) {
  fireEvent.change(screen.getByLabelText(labelled(label)), { target: { value: text } });
}

function day(label: string) {
  return within(screen.getByRole('group', { name: label }));
}

describe('MeetingTypeForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.create.mockResolvedValue({ data: { createMeetingType: { id: 'type-9' } } });
    gql.update.mockResolvedValue({ data: { updateMeetingType: { id: 'type-1' } } });
  });

  it('writes a new type’s link from its name until the link is edited by hand', async () => {
    renderForm();

    fillField('Meeting name', 'Discovery Call');
    expect(screen.getByLabelText(/^Link\s*\*?$/)).toHaveValue('discovery-call');

    fillField('Link', 'disco');
    fillField('Meeting name', 'Something else');
    expect(screen.getByLabelText(/^Link\s*\*?$/)).toHaveValue('disco');
  });

  it('leaves a saved type’s link alone when its name changes', async () => {
    renderForm(meetingTypeRow());

    fillField('Meeting name', 'Renamed call');

    expect(screen.getByLabelText(/^Link\s*\*?$/)).toHaveValue('intro-call');
  });

  it('shows weekdays with their hours and the weekend as unavailable', () => {
    renderForm();

    expect(day('Monday').getByLabelText(/^From\s*\*?$/)).toHaveValue('09:00');
    expect(day('Monday').getByLabelText(/^To\s*\*?$/)).toHaveValue('17:00');
    expect(day('Monday').queryByText('Unavailable')).not.toBeInTheDocument();
    expect(day('Sunday').getByText('Unavailable')).toBeInTheDocument();
    expect(day('Sunday').queryAllByLabelText(/^From\s*\*?$/)).toHaveLength(0);
  });

  it('swaps a day between its hours and "Unavailable" with its switch', async () => {
    renderForm();

    await userEvent.click(day('Saturday').getByLabelText(/^Saturday\s*\*?$/));
    expect(day('Saturday').getByLabelText(/^To\s*\*?$/)).toHaveValue('17:00');
    expect(day('Saturday').queryByText('Unavailable')).not.toBeInTheDocument();

    await userEvent.click(day('Monday').getByLabelText(/^Monday\s*\*?$/));
    expect(day('Monday').getByText('Unavailable')).toBeInTheDocument();
  });

  it('creates a type with the defaults, in the browser’s zone', async () => {
    const { onDone } = renderForm();
    fillField('Meeting name', 'Discovery Call');

    await press('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          ...toMeetingTypeValues(null, zone),
          title: 'Discovery Call',
          slug: 'discovery-call',
        },
      },
    });
    expect(await screen.findByText('Meeting type created')).toBeInTheDocument();
  });

  it('will not save a type nobody can book', async () => {
    renderForm();
    fillField('Meeting name', 'Discovery Call');
    for (const label of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']) {
      await userEvent.click(day(label).getByLabelText(labelled(label)));
    }

    await press('Create');

    expect(await screen.findByText('Make at least one day available')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('checks the length and the booking rules before saving', async () => {
    renderForm();
    fillField('Meeting name', 'Discovery Call');
    fillField('Length (minutes)', '2');
    fillField('Booking window', '400');

    await press('Create');

    expect(await screen.findByText('Between 5 and 480 minutes')).toBeInTheDocument();
    expect(screen.getByText('Between 1 and 365 days')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('updates a saved type by id with the length typed', async () => {
    const { onDone } = renderForm(meetingTypeRow());
    fillField('Length (minutes)', '45');
    await userEvent.click(screen.getByLabelText(/^The booking link is open\s*\*?$/));

    await press('Update');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'type-1',
        input: {
          ...toMeetingTypeValues(meetingTypeRow(), zone),
          durationMinutes: 45,
          active: false,
        },
      },
    });
  });

  it('hands cancel back to the page', async () => {
    const { onCancel } = renderForm();

    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
