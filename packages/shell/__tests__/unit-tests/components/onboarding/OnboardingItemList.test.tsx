import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OnboardingOwner } from '@/graphql/generated';
import {
  OnboardingItemList,
  canTickAny,
  canTickOwn,
  type OnboardingItem,
} from '@/components/onboarding';
import { renderWithProviders } from '../../test-utils';

const item = (patch: Partial<OnboardingItem>): OnboardingItem => ({
  __typename: 'OnboardingItem',
  key: 'laptop',
  label: 'Issue a laptop',
  owner: OnboardingOwner.It,
  dueOn: '2026-10-10',
  done: false,
  doneAt: null,
  doneByName: null,
  notes: '',
  ...patch,
});

const ITEMS = [
  item({ key: 'laptop', done: true, doneByName: 'Ravi' }),
  item({
    key: 'docs',
    label: 'Upload ID documents',
    owner: OnboardingOwner.Employee,
    notes: 'PAN and Aadhaar',
  }),
];

const formatDate = (value: string) => `on ${value}`;

describe('canTick rules', () => {
  it('lets HR and IT tick anything, and a joiner only their own tasks', () => {
    expect(canTickAny(ITEMS[0])).toBe(true);
    expect(canTickOwn(ITEMS[0])).toBe(false);
    expect(canTickOwn(ITEMS[1])).toBe(true);
  });
});

describe('OnboardingItemList', () => {
  it('summarises progress and describes each task', () => {
    renderWithProviders(
      <OnboardingItemList
        items={ITEMS}
        progressPercent={50}
        canTick={canTickAny}
        onToggle={vi.fn()}
        formatDate={formatDate}
      />,
    );

    expect(screen.getByText('1 of 2 done')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Onboarding progress' })).toHaveAttribute(
      'aria-valuenow',
      '50',
    );
    expect(screen.getByText('Due on 2026-10-10 · ticked by Ravi')).toBeInTheDocument();
    expect(screen.getByText('Due on 2026-10-10')).toBeInTheDocument();
    expect(screen.getByText('PAN and Aadhaar')).toBeInTheDocument();
    expect(screen.getByText('EMPLOYEE')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Issue a laptop' })).toBeChecked();
  });

  it('ticks a task the viewer may tick, and locks the rest', async () => {
    const onToggle = vi.fn();
    renderWithProviders(
      <OnboardingItemList
        items={ITEMS}
        progressPercent={50}
        canTick={canTickOwn}
        onToggle={onToggle}
        formatDate={formatDate}
      />,
    );

    expect(screen.getByRole('checkbox', { name: 'Issue a laptop' })).toBeDisabled();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Upload ID documents' }));

    expect(onToggle).toHaveBeenCalledWith(ITEMS[1], true);
  });

  it('locks every tick while a change is saving', () => {
    renderWithProviders(
      <OnboardingItemList
        items={ITEMS}
        progressPercent={50}
        canTick={canTickAny}
        onToggle={vi.fn()}
        busy
        formatDate={formatDate}
      />,
    );

    expect(screen.getByRole('checkbox', { name: 'Issue a laptop' })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: 'Upload ID documents' })).toBeDisabled();
  });

  it('reads an empty checklist as nothing done', () => {
    renderWithProviders(
      <OnboardingItemList
        items={[]}
        progressPercent={0}
        canTick={canTickAny}
        onToggle={vi.fn()}
        formatDate={formatDate}
      />,
    );

    expect(screen.getByText('0 of 0 done')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
});
