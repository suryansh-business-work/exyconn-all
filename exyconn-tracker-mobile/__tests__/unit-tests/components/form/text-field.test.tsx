import { zodResolver } from '@hookform/resolvers/zod';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { AccessibilityInfo } from 'react-native';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { FieldFrame } from '../../../../src/components/form/FieldFrame';
import { TextField } from '../../../../src/components/form/TextField';
import { renderWithProviders } from '../../test-utils';

const schema = z.object({ name: z.string().min(2, 'Use at least two letters.') });

type Values = z.infer<typeof schema>;

interface HarnessProps {
  initial?: string;
  secret?: boolean;
  multiline?: boolean;
  disabled?: boolean;
  onSubmitEditing?: () => void;
}

function Harness({
  initial,
  secret,
  multiline,
  disabled,
  onSubmitEditing,
}: Readonly<HarnessProps>) {
  const { control } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: initial },
    mode: 'onChange',
  });
  return (
    <TextField
      control={control}
      name="name"
      label="Name"
      hint="As it appears on your payslip."
      placeholder="Your name"
      secret={secret}
      multiline={multiline}
      disabled={disabled}
      onSubmitEditing={onSubmitEditing}
    />
  );
}

describe('FieldFrame', () => {
  it('shows the hint until there is an error to show instead', () => {
    const { rerender } = renderWithProviders(
      <FieldFrame id="email" label="Email" hint="Your work address.">
        <span>control</span>
      </FieldFrame>,
    );
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('control')).toBeInTheDocument();
    expect(screen.getByText('Your work address.')).toBeInTheDocument();

    rerender(
      <FieldFrame id="email" label="Email" hint="Your work address." error="Enter an email.">
        <span>control</span>
      </FieldFrame>,
    );
    expect(screen.getByText('Enter an email.')).toBeInTheDocument();
    expect(screen.queryByText('Your work address.')).toBeNull();
  });

  it('announces a new error without moving focus', () => {
    const { rerender } = renderWithProviders(
      <FieldFrame id="email" label="Email">
        <span>control</span>
      </FieldFrame>,
    );
    rerender(
      <FieldFrame id="email" label="Email" error="Enter an email.">
        <span>control</span>
      </FieldFrame>,
    );
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith('Enter an email.');
  });

  it('shows nothing under the control when there is neither hint nor error', () => {
    renderWithProviders(
      <div data-testid="frame">
        <FieldFrame id="note" label="Note">
          <span>control</span>
        </FieldFrame>
      </div>,
    );
    expect(screen.getByTestId('frame')).toHaveTextContent(/^Notecontrol$/);
  });
});

describe('TextField', () => {
  it('labels the input and keeps the form value in step with typing', () => {
    renderWithProviders(<Harness />);
    const input = screen.getByLabelText('Name');
    expect(input).toHaveValue('');
    expect(input).toHaveAttribute('placeholder', 'Your name');
    fireEvent.change(input, { target: { value: 'Asha' } });
    expect(input).toHaveValue('Asha');
    expect(screen.getByText('As it appears on your payslip.')).toBeInTheDocument();
  });

  it('replaces the hint with the schema’s message and marks the input invalid', async () => {
    renderWithProviders(<Harness initial="" />);
    const input = screen.getByLabelText('Name');
    expect(input).toHaveAttribute('aria-invalid', 'false');
    fireEvent.change(input, { target: { value: 'A' } });
    expect(await screen.findByText('Use at least two letters.')).toBeInTheDocument();
    expect(screen.queryByText('As it appears on your payslip.')).toBeNull();
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('clears the error once the value is valid', async () => {
    renderWithProviders(<Harness initial="Asha" />);
    const input = screen.getByLabelText('Name');
    fireEvent.change(input, { target: { value: 'A' } });
    await screen.findByText('Use at least two letters.');
    fireEvent.change(input, { target: { value: 'Asha' } });
    await waitFor(() => expect(screen.queryByText('Use at least two letters.')).toBeNull());
  });

  it('submits from the keyboard', () => {
    const onSubmitEditing = vi.fn();
    renderWithProviders(<Harness onSubmitEditing={onSubmitEditing} />);
    fireEvent.keyDown(screen.getByLabelText('Name'), { key: 'Enter' });
    expect(onSubmitEditing).toHaveBeenCalledTimes(1);
  });

  it('offers a Show/Hide toggle for a secret', () => {
    renderWithProviders(<Harness secret />);
    fireEvent.click(screen.getByRole('button', { name: 'Show' }));
    expect(screen.getByRole('button', { name: 'Hide' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Hide' }));
    expect(screen.getByRole('button', { name: 'Show' })).toBeInTheDocument();
  });

  it('has no toggle for plain text, even when multiline', () => {
    renderWithProviders(<Harness multiline />);
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show' })).toBeNull();
  });

  it('can be switched off', () => {
    renderWithProviders(<Harness disabled />);
    expect(screen.getByLabelText('Name')).toHaveAttribute('aria-disabled', 'true');
  });
});
