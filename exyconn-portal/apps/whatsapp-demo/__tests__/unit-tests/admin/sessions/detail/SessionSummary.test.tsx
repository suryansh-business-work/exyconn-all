import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { DEFAULT_FORMAT_SETTINGS, formatDateTime } from '@exyconn/i18n';
import { SessionSummary } from '../../../../../src/admin/sessions/detail/SessionSummary';
import { renderWithProviders } from '../../../test-utils';
import { sessionRow } from '../../admin.fixtures';

const INDUSTRIES: Readonly<Record<string, string>> = { clinic: 'Healthcare', salon: 'Beauty' };
const industryName = (key: string) => INDUSTRIES[key] ?? key;

/** The value shown beside a fact's label. */
const fact = (label: string) => screen.getByText(label).nextElementSibling;

describe('SessionSummary', () => {
  it('says who ran the session, when, for how long and what they got through', () => {
    const session = sessionRow({ demos: ['clinic', 'salon', 'bakery'], events: 1234 });
    renderWithProviders(<SessionSummary session={session} industryName={industryName} />);
    expect(screen.getByText('Ravi Kumar')).toBeInTheDocument();
    expect(screen.getByText('ravi@example.com')).toBeInTheDocument();
    expect(fact('Started')).toHaveTextContent(
      formatDateTime(session.startedAt, DEFAULT_FORMAT_SETTINGS),
    );
    expect(fact('Last activity')).toHaveTextContent(
      formatDateTime(session.lastEventAt, DEFAULT_FORMAT_SETTINGS),
    );
    expect(fact('Duration')).toHaveTextContent('5m');
    expect(fact('Device')).toHaveTextContent('Phone (390x844)');
    expect(fact('Industries opened')).toHaveTextContent('Healthcare, Beauty, and bakery');
    expect(fact('Flows')).toHaveTextContent('2 started, 1 completed');
    expect(fact('Events')).toHaveTextContent('1,234');
    expect(fact('Status')).toHaveTextContent('ended');
  });

  it('writes a device without a viewport, and a dash when nothing was opened', () => {
    renderWithProviders(
      <SessionSummary
        session={sessionRow({ device: null, viewport: null, demos: [] })}
        industryName={industryName}
      />,
    );
    expect(fact('Device')).toHaveTextContent('—');
    expect(fact('Industries opened')).toHaveTextContent('—');
  });

  it('names a device the chat reports without a viewport', () => {
    renderWithProviders(
      <SessionSummary
        session={sessionRow({ device: 'desktop', viewport: '' })}
        industryName={industryName}
      />,
    );
    expect(fact('Device')).toHaveTextContent(/^Desktop$/);
  });
});
