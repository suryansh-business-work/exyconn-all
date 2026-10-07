import { zodResolver } from '@hookform/resolvers/zod';
import {
  DateTimePickerAndroid,
  type AndroidNativeProps,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { act, fireEvent, screen } from '@testing-library/react';
import { formatDateTime } from '@exyconn/tracker-core';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { DateTimeField } from '../../../../src/components/form/DateTimeField';
import { Platform } from '../../mocks/react-native/apis';
import { renderWithProviders } from '../../test-utils';

const schema = z.object({ startedAt: z.string().min(1, 'Choose when it started.') });
type Values = z.infer<typeof schema>;

const ZONE = 'Asia/Kolkata';
const MAX = new Date('2026-10-07T00:00:00.000Z');
const MIN = new Date('2026-07-09T00:00:00.000Z');

function Harness({ initial }: Readonly<{ initial?: string }>) {
  const { control, handleSubmit } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { startedAt: initial },
  });
  return (
    <>
      <DateTimeField
        control={control}
        name="startedAt"
        label="Started"
        timezone={ZONE}
        hint="When the work began."
        maximumDate={MAX}
        minimumDate={MIN}
      />
      <button type="button" onClick={handleSubmit(() => undefined)}>
        Submit
      </button>
    </>
  );
}

function androidCall(index: number): AndroidNativeProps {
  const call = vi.mocked(DateTimePickerAndroid.open).mock.calls[index];
  if (call === undefined) {
    throw new Error(`The Android picker was not opened ${index + 1} time(s).`);
  }
  return call[0];
}

const SET: DateTimePickerEvent = { type: 'set', nativeEvent: { timestamp: 0, utcOffset: 0 } };
const DISMISSED: DateTimePickerEvent = {
  type: 'dismissed',
  nativeEvent: { timestamp: 0, utcOffset: 0 },
};

describe('DateTimeField', () => {
  it('says nothing is chosen yet', () => {
    renderWithProviders(<Harness />);
    expect(screen.getByRole('button', { name: 'Started: not set' })).toBeInTheDocument();
    expect(screen.getByText('Choose a date and time')).toBeInTheDocument();
    expect(screen.getByText('When the work began.')).toBeInTheDocument();
  });

  it('shows a chosen instant in the employee’s zone', () => {
    const iso = '2026-10-05T09:30:00.000Z';
    renderWithProviders(<Harness initial={iso} />);
    const shown = formatDateTime(iso, ZONE);
    expect(screen.getByRole('button', { name: `Started: ${shown}` })).toBeInTheDocument();
    expect(screen.getByText(shown)).toBeInTheDocument();
  });

  it('opens the inline wheel on iOS and stores the picked instant', () => {
    renderWithProviders(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Started: not set' }));
    const wheel = screen.getByLabelText('date-time-picker-datetime');
    fireEvent.change(wheel, { target: { value: '2026-10-06T04:00:00.000Z' } });
    expect(screen.getByText(formatDateTime('2026-10-06T04:00:00.000Z', ZONE))).toBeInTheDocument();
  });

  it('keeps the value when the iOS wheel reports no date, and closes on a second tap', () => {
    renderWithProviders(<Harness />);
    const field = screen.getByRole('button', { name: 'Started: not set' });
    fireEvent.click(field);
    fireEvent.change(screen.getByLabelText('date-time-picker-datetime'), {
      target: { value: '' },
    });
    expect(screen.getByText('Choose a date and time')).toBeInTheDocument();
    fireEvent.click(field);
    expect(screen.queryByLabelText('date-time-picker-datetime')).toBeNull();
  });

  it('on Android asks for the date, then the time on that date', () => {
    Platform.OS = 'android';
    renderWithProviders(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Started: not set' }));
    const date = androidCall(0);
    expect(date.mode).toBe('date');
    expect(date.maximumDate).toBe(MAX);
    expect(date.minimumDate).toBe(MIN);

    const day = new Date('2026-10-06T00:00:00.000Z');
    act(() => date.onChange?.(SET, day));
    const time = androidCall(1);
    expect(time.mode).toBe('time');
    expect(time.value).toBe(day);

    act(() => time.onChange?.(SET, new Date('2026-10-06T05:15:00.000Z')));
    expect(screen.getByText(formatDateTime('2026-10-06T05:15:00.000Z', ZONE))).toBeInTheDocument();
  });

  it('on Android stops when the date dialog is dismissed', () => {
    Platform.OS = 'android';
    renderWithProviders(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Started: not set' }));
    act(() => androidCall(0).onChange?.(DISMISSED));
    expect(DateTimePickerAndroid.open).toHaveBeenCalledTimes(1);
    act(() => androidCall(0).onChange?.(SET));
    expect(DateTimePickerAndroid.open).toHaveBeenCalledTimes(1);
  });

  it('on Android keeps the value when the time dialog is dismissed', () => {
    Platform.OS = 'android';
    renderWithProviders(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Started: not set' }));
    act(() => androidCall(0).onChange?.(SET, new Date('2026-10-06T00:00:00.000Z')));
    act(() => androidCall(1).onChange?.(DISMISSED, new Date('2026-10-06T05:15:00.000Z')));
    expect(screen.getByText('Choose a date and time')).toBeInTheDocument();
  });

  it('replaces the hint with the schema’s message', async () => {
    renderWithProviders(<Harness initial="" />);
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(await screen.findByText('Choose when it started.')).toBeInTheDocument();
    expect(screen.queryByText('When the work began.')).toBeNull();
  });
});
