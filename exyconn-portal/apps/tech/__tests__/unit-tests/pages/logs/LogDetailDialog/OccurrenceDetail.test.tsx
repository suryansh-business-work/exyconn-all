import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { OccurrenceDetail } from '../../../../../src/pages/logs/LogDetailDialog/OccurrenceDetail';
import { renderWithProviders } from '../../../test-utils';
import { logEvent } from '../log.fixtures';

vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('../log.fixtures')).settingsModule(),
);

function blockAfter(title: string): string | null | undefined {
  return screen.getByText(title).nextElementSibling?.textContent;
}

function valueOf(label: string): string | null | undefined {
  return screen.getByText(label).parentElement?.textContent;
}

describe('OccurrenceDetail', () => {
  it('shows the stack, the component stack, the breadcrumbs and the context', () => {
    renderWithProviders(<OccurrenceDetail event={logEvent()} />);

    expect(
      screen.getByText('Cannot read properties of undefined (reading "id")'),
    ).toBeInTheDocument();
    expect(blockAfter('Stack')).toBe('at Timer.tsx:12');
    expect(blockAfter('React component stack')).toBe('at Timer\n  at App');
    expect(blockAfter('What happened just before (oldest first)')).toBe(
      'at 2026-10-07T08:59:58.000Z  INFO  Opened timer\nat 2026-10-07T08:59:59.000Z  WARN  Task list empty',
    );
    expect(blockAfter('Context')).toBe('{"taskId":"t-9"}');
  });

  it('says when it arrived, for whom and on which device and session', () => {
    renderWithProviders(<OccurrenceDetail event={logEvent()} />);

    expect(valueOf('Received')).toBe('Receivedat 2026-10-07T09:00:02.000Z');
    expect(valueOf('Email')).toBe('Emailasha@example.test');
    expect(valueOf('Device ID')).toBe('Device IDdev-42');
    expect(valueOf('Session')).toBe('Sessionsess-7');
    expect(valueOf('User agent')).toBe('User agentExyconnTracker/1.9.7');
  });

  it('leaves out empty blocks and dashes what the occurrence did not carry', () => {
    renderWithProviders(
      <OccurrenceDetail
        event={logEvent({
          componentStack: '',
          context: '',
          breadcrumbs: [],
          userEmail: '',
          deviceId: '',
          sessionId: '',
          userAgent: '',
        })}
      />,
    );

    expect(screen.queryByText('React component stack')).not.toBeInTheDocument();
    expect(screen.queryByText('Context')).not.toBeInTheDocument();
    expect(screen.queryByText('What happened just before (oldest first)')).not.toBeInTheDocument();
    expect(valueOf('Email')).toBe('Email—');
    expect(valueOf('Device ID')).toBe('Device ID—');
    expect(valueOf('Session')).toBe('Session—');
    expect(valueOf('User agent')).toBe('User agent—');
  });
});
