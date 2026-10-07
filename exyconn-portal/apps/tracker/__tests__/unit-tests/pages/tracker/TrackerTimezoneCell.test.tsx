import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { TrackerTimezoneCell } from '../../../../src/pages/tracker/TrackerTimezoneCell';
import { renderWithProviders } from '../../test-utils';

describe('TrackerTimezoneCell', () => {
  it('shows the zone, its offset and why it won', () => {
    renderWithProviders(
      <TrackerTimezoneCell resolution={{ timezone: 'Asia/Kolkata', source: 'workspace' }} />,
    );
    expect(screen.getByText('Asia/Kolkata')).toBeInTheDocument();
    expect(screen.getByText('UTC+05:30 · workspace default')).toBeInTheDocument();
  });

  it("says the reason in the reader's language and leaves the offset alone", () => {
    renderWithProviders(
      <TrackerTimezoneCell resolution={{ timezone: 'Asia/Kolkata', source: 'chosen' }} />,
      { locale: 'fr', messages: { chosen: 'choisi' } },
    );
    expect(screen.getByText('UTC+05:30 · choisi')).toBeInTheDocument();
  });
});
