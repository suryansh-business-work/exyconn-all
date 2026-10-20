import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useFormatters } from '@exyconn/i18n';
import { AudienceUpdateMode } from '@exyconn/shell/graphql/generated';
import { AudienceModeSection } from '../../../../../../src/pages/audiences/forms/audience-list/AudienceModeSection';
import { renderHookWithProviders, renderWithProviders } from '../../../../test-utils';
import { AudienceFormHarness, formProbe } from './audience-form-harness';

const FREEZES = 'Saving freezes the audience exactly as the counts below show it.';
const SNAPSHOT_AT = '2026-10-01T08:30:00.000Z';

function renderMode(snapshotAt: string | null, updateMode?: AudienceUpdateMode) {
  const probe = formProbe();
  renderWithProviders(
    <AudienceFormHarness values={updateMode && { updateMode }} capture={probe.capture}>
      <AudienceModeSection snapshotAt={snapshotAt} />
    </AudienceFormHarness>,
  );
  return probe;
}

describe('AudienceModeSection', () => {
  it('keeps a new audience live, with nothing frozen to explain', () => {
    renderMode(null);

    expect(screen.getByRole('radio', { name: /Live dynamic audience/ })).toBeChecked();
    expect(screen.queryByText(FREEZES)).toBeNull();
    expect(
      screen.getByText('Unsubscribes and blocks are always respected, whichever mode you choose.'),
    ).toBeInTheDocument();
  });

  it('says saving freezes the audience once a fixed mode is chosen', async () => {
    const probe = renderMode(null);

    await userEvent.click(screen.getByRole('radio', { name: /Fixed snapshot/ }));
    expect(probe.values().updateMode).toBe(AudienceUpdateMode.FixedSnapshot);
    expect(screen.getByText(FREEZES)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('radio', { name: /Fixed records, latest emails/ }));
    expect(probe.values().updateMode).toBe(AudienceUpdateMode.FixedRecords);
    expect(screen.getByText(FREEZES)).toBeInTheDocument();
  });

  it('says when a saved fixed audience was frozen', () => {
    const { result } = renderHookWithProviders(() => useFormatters());
    renderMode(SNAPSHOT_AT, AudienceUpdateMode.FixedSnapshot);

    expect(
      screen.getByText(
        `Frozen on ${result.current.formatDateTime(SNAPSHOT_AT)}. Saving again takes a new snapshot from the counts below.`,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(FREEZES)).toBeNull();
  });

  it('says nothing about a snapshot once the audience is live again', async () => {
    renderMode(SNAPSHOT_AT, AudienceUpdateMode.FixedSnapshot);

    await userEvent.click(screen.getByRole('radio', { name: /Live dynamic audience/ }));

    expect(screen.queryByText(/Frozen on/)).toBeNull();
  });
});
