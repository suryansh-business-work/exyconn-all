import { describe, expect, it, vi } from 'vitest';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { isolatedSubmit } from '../../../src/forms/isolated-submit';

interface Values {
  name: string;
}

function InnerForm({ onValid }: Readonly<{ onValid: (values: Values) => void }>) {
  const methods = useForm<Values>({ defaultValues: { name: 'Ada' } });
  // Portalled out of the host form in the DOM, as MUI's Dialog is.
  return createPortal(
    <form aria-label="Inner" onSubmit={isolatedSubmit(methods, onValid)}>
      <input aria-label="Name" {...methods.register('name')} />
    </form>,
    document.body,
  );
}

describe('isolatedSubmit', () => {
  it('submits the inner form without submitting the form around it', async () => {
    const onValid = vi.fn();
    const onOuterSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    render(
      <form aria-label="Outer" onSubmit={onOuterSubmit}>
        <InnerForm onValid={onValid} />
      </form>,
    );

    fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), { target: { value: 'Grace' } });
    fireEvent.submit(screen.getByRole('form', { name: 'Inner' }));

    await waitFor(() => expect(onValid).toHaveBeenCalledWith({ name: 'Grace' }, expect.anything()));
    expect(onOuterSubmit).not.toHaveBeenCalled();
  });
});
