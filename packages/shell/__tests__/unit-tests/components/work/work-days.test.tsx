import { describe, expect, it } from 'vitest';
import { renderHook, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nProvider } from '@exyconn/i18n';
import {
  WEEK_DAYS,
  WorkDayChips,
  inWeekOrder,
  useWeekLabel,
  useWeekdayName,
  weekdayName,
} from '@/components/work';
import { renderWithProviders } from '../../test-utils';

const inLocale =
  (locale: string) =>
  ({ children }: Readonly<{ children: ReactNode }>) => (
    <I18nProvider locale={locale} messages={{}}>
      {children}
    </I18nProvider>
  );

describe('work days', () => {
  it('reads a week Monday first, Sunday last', () => {
    expect(WEEK_DAYS).toEqual([1, 2, 3, 4, 5, 6, 0]);
  });

  it('names a weekday from its server number, short or long, in the locale', () => {
    expect(weekdayName(0, 'en')).toBe('Sun');
    expect(weekdayName(1, 'en', 'long')).toBe('Monday');
    expect(weekdayName(6, 'en', 'long')).toBe('Saturday');
    expect(weekdayName(1, 'fr', 'long')).toBe('lundi');
  });

  it('orders picked days Monday first and drops repeats and unknown numbers', () => {
    expect(inWeekOrder([0, 5, 1, 1, 3])).toEqual([1, 3, 5, 0]);
    expect(inWeekOrder([7, -1])).toEqual([]);
    expect(inWeekOrder([])).toEqual([]);
  });

  it("names days in the person's language", () => {
    const { result } = renderHook(() => useWeekdayName('long'), { wrapper: inLocale('de') });
    expect(result.current(3)).toBe('Mittwoch');
  });

  it('says a week as one phrase, in week order', () => {
    const { result } = renderHook(() => useWeekLabel(), { wrapper: inLocale('en') });
    expect(result.current([5, 1, 3])).toBe('Mon, Wed, and Fri');
    expect(result.current([])).toBe('');
  });
});

describe('WorkDayChips', () => {
  it("shows the person's own week, Monday first, as filled chips", () => {
    renderWithProviders(<WorkDayChips days={[6, 1, 2]} fromCompany={false} />);
    const labels = screen.getAllByText(/^(Mon|Tue|Sat)$/).map((chip) => chip.textContent);
    expect(labels).toEqual(['Mon', 'Tue', 'Sat']);
    expect(screen.getByText('Own week')).toBeInTheDocument();
    expect(screen.getByText('Mon').closest('.MuiChip-root')).toHaveClass('MuiChip-filled');
  });

  it("marks the company's week as outlined and says so", () => {
    renderWithProviders(<WorkDayChips days={[1, 2, 3, 4, 5]} fromCompany />);
    expect(screen.getByText('Company week')).toBeInTheDocument();
    expect(screen.queryByText('Own week')).not.toBeInTheDocument();
    expect(screen.getByText('Fri').closest('.MuiChip-root')).toHaveClass('MuiChip-outlined');
  });
});
