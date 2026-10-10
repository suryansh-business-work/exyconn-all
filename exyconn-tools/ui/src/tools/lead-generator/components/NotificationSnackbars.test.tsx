import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import NotificationSnackbars from './NotificationSnackbars';

afterEach(cleanup);

describe('NotificationSnackbars', () => {
  it('shows nothing without an error or a success message', () => {
    render(
      <NotificationSnackbars error={null} successMessage={null} onErrorClose={vi.fn()} onSuccessClose={vi.fn()} />
    );
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('shows the error and the success message and reports which one was closed', () => {
    const onErrorClose = vi.fn();
    const onSuccessClose = vi.fn();
    render(
      <NotificationSnackbars
        error="Search failed"
        successMessage="Found 3 businesses"
        onErrorClose={onErrorClose}
        onSuccessClose={onSuccessClose}
      />
    );
    const error = screen.getByText('Search failed').closest('[role="alert"]') as HTMLElement;
    const success = screen.getByText('Found 3 businesses').closest('[role="alert"]') as HTMLElement;

    fireEvent.click(error.querySelector('button') as HTMLElement);
    expect(onErrorClose).toHaveBeenCalledTimes(1);
    expect(onSuccessClose).not.toHaveBeenCalled();

    fireEvent.click(success.querySelector('button') as HTMLElement);
    expect(onSuccessClose).toHaveBeenCalledTimes(1);
  });
});
