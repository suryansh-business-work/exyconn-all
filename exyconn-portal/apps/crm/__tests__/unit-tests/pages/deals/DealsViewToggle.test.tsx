import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  DEALS_BOARD_PATH,
  DEALS_LIST_PATH,
  DealsViewToggle,
} from '../../../../src/pages/deals/DealsViewToggle';
import { renderWithProviders } from '../../test-utils';
import { UrlProbe } from '../../form-stub';

const renderAt = (route: string) =>
  renderWithProviders(
    <>
      <DealsViewToggle />
      <UrlProbe />
    </>,
    { route },
  );

const url = () => screen.getByLabelText('current url');

describe('DealsViewToggle', () => {
  it('names the two views of the deals', () => {
    expect(DEALS_BOARD_PATH).toBe('/crm/deals');
    expect(DEALS_LIST_PATH).toBe('/crm/deals/list');
  });

  it('selects the board on the board route and switches to the list', async () => {
    renderAt(DEALS_BOARD_PATH);

    expect(screen.getByRole('group', { name: 'deals view' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'board view' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await userEvent.click(screen.getByRole('button', { name: 'list view' }));

    expect(url()).toHaveTextContent(DEALS_LIST_PATH);
  });

  it('selects the list on the list route and switches back to the board', async () => {
    renderAt(DEALS_LIST_PATH);

    expect(screen.getByRole('button', { name: 'list view' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await userEvent.click(screen.getByRole('button', { name: 'board view' }));

    expect(url().textContent).toBe(DEALS_BOARD_PATH);
  });

  it('stays put when the selected view is clicked again', async () => {
    renderAt(DEALS_LIST_PATH);

    await userEvent.click(screen.getByRole('button', { name: 'list view' }));

    expect(url().textContent).toBe(DEALS_LIST_PATH);
    expect(screen.getByRole('button', { name: 'list view' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('treats any other route as the board', () => {
    renderAt('/crm');

    expect(screen.getByRole('button', { name: 'board view' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
