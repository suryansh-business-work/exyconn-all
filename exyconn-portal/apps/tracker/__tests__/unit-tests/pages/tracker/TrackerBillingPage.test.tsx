import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { BillingRange } from '../../../../src/pages/tracker/BillingRangePicker';
import { TrackerBillingPage } from '../../../../src/pages/tracker/TrackerBillingPage';
import { renderWithProviders } from '../../test-utils';
import { PICKED, resetRecorded, tabberProps } from './tracker.mocks';

vi.mock('@exyconn/tabber', async () => (await import('./tracker.mocks')).tabberModuleMock());
vi.mock('@exyconn/ui/pickers', async (importOriginal) =>
  (await import('./tracker.mocks')).pickersModuleMock(importOriginal),
);
vi.mock('../../../../src/pages/tracker/TrackerBillingEmployees', () => ({
  TrackerBillingEmployees: ({ range }: Readonly<{ range: BillingRange }>) => (
    <p>{`Employees ${range.from} → ${range.to}`}</p>
  ),
}));
vi.mock('../../../../src/pages/tracker/TrackerBillingByProject', () => ({
  TrackerBillingByProject: ({ range }: Readonly<{ range: BillingRange }>) => (
    <p>{`Projects ${range.from} → ${range.to}`}</p>
  ),
}));

const MAY_FROM = new Date(2026, 4, 1).toISOString();
const JUNE_FROM = new Date(2026, 5, 1).toISOString();

const tab = (label: string) => within(screen.getByRole('region', { name: label }));

describe('TrackerBillingPage', () => {
  beforeEach(() => {
    resetRecorded();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 4, 20, 12));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps its two views under the billing path, employees first', () => {
    renderWithProviders(<TrackerBillingPage />);
    expect(screen.getByRole('heading', { name: 'Billing' })).toBeInTheDocument();
    expect(tabberProps().basePath).toBe('/tracker/billing');
    expect(tabberProps().ariaLabel).toBe('Billing views');
    expect(tabberProps().items.map((item) => [item.slug, item.label])).toEqual([
      ['employees', 'By employee'],
      ['projects', 'By project'],
    ]);
  });

  it('opens both views on the current calendar month', () => {
    renderWithProviders(<TrackerBillingPage />);
    expect(
      tab('By employee').getByText(`Employees ${MAY_FROM} → ${JUNE_FROM}`),
    ).toBeInTheDocument();
    expect(tab('By project').getByText(`Projects ${MAY_FROM} → ${JUNE_FROM}`)).toBeInTheDocument();
  });

  it('hands a changed period to both views, so switching tabs keeps it', async () => {
    renderWithProviders(<TrackerBillingPage />);
    await userEvent.click(
      within(screen.getByRole('group', { name: 'From' })).getByRole('button', { name: 'Pick' }),
    );
    const picked = PICKED.toISOString();
    expect(tab('By employee').getByText(`Employees ${picked} → ${JUNE_FROM}`)).toBeInTheDocument();
    expect(tab('By project').getByText(`Projects ${picked} → ${JUNE_FROM}`)).toBeInTheDocument();
  });

  it('translates the tab names', () => {
    renderWithProviders(<TrackerBillingPage />, {
      locale: 'hi',
      messages: { 'By employee': 'कर्मचारी के अनुसार' },
    });
    expect(tabberProps().items[0].label).toBe('कर्मचारी के अनुसार');
  });
});
