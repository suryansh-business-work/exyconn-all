import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import type { MockLink } from '@apollo/client/testing';
import { MyWorkProfileDocument, WorkLocation, WorkingTime } from '@/graphql/generated';
import {
  MyWorkArrangementCard,
  WorkArrangementFacts,
  type WorkArrangement,
} from '@/components/work';
import { renderWithProviders } from '../../test-utils';

const arrangement: WorkArrangement = {
  address: '12 MG Road, Bengaluru',
  brief: 'Backend engineer on payroll',
  workingTime: WorkingTime.Other,
  workingTimeNote: 'Four long days',
  workLocation: WorkLocation.Hybrid,
  workLocationNote: null,
  workHoursPerDay: null,
};

describe('WorkArrangementFacts', () => {
  it('states the working time, location and day length, defaulting the hours', () => {
    renderWithProviders(<WorkArrangementFacts arrangement={arrangement} />);

    expect(screen.getByText('Other — Four long days')).toBeInTheDocument();
    expect(screen.getByText('Hybrid')).toBeInTheDocument();
    expect(screen.getByText('8 h')).toBeInTheDocument();
  });

  it('keeps the address and brief off unless asked for', () => {
    renderWithProviders(<WorkArrangementFacts arrangement={arrangement} />);

    expect(screen.queryByText('12 MG Road, Bengaluru')).not.toBeInTheDocument();
    expect(screen.queryByText('Backend engineer on payroll')).not.toBeInTheDocument();
  });

  it('shows the address and brief with showProfile', () => {
    renderWithProviders(<WorkArrangementFacts arrangement={arrangement} showProfile />);

    expect(screen.getByText('12 MG Road, Bengaluru')).toBeInTheDocument();
    expect(screen.getByText('Backend engineer on payroll')).toBeInTheDocument();
  });

  it('skips an empty address or brief even with showProfile', () => {
    renderWithProviders(
      <WorkArrangementFacts
        arrangement={{ ...arrangement, address: '', brief: null }}
        showProfile
      />,
    );

    expect(screen.queryByText('Address')).not.toBeInTheDocument();
    expect(screen.queryByText('Brief')).not.toBeInTheDocument();
  });
});

const profileMock = (me: WorkArrangement & { id: string }): MockLink.MockedResponse => ({
  request: { query: MyWorkProfileDocument },
  result: { data: { me: { __typename: 'User', ...me } } },
});

describe('MyWorkArrangementCard', () => {
  it('shows a placeholder while the profile loads, then the arrangement and its hours', async () => {
    renderWithProviders(<MyWorkArrangementCard />, {
      mocks: [profileMock({ id: 'user-1', ...arrangement, workHoursPerDay: 6 })],
    });

    expect(screen.getByText('My working arrangement')).toBeInTheDocument();
    expect(document.querySelector('.MuiSkeleton-root')).not.toBeNull();

    expect(await screen.findByText(/Your day is 6 hours/)).toBeInTheDocument();
    expect(screen.getByText('6 h')).toBeInTheDocument();
    expect(document.querySelector('.MuiSkeleton-root')).toBeNull();
  });

  it('shows only the heading when the profile cannot be loaded', async () => {
    renderWithProviders(<MyWorkArrangementCard />, {
      mocks: [{ request: { query: MyWorkProfileDocument }, error: new Error('offline') }],
    });

    await screen.findByText('My working arrangement');
    await expect.poll(() => document.querySelector('.MuiSkeleton-root')).toBeNull();
    expect(screen.queryByText(/Your day is/)).not.toBeInTheDocument();
  });
});
