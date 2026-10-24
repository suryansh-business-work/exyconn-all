import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFormatters, useI18n } from '@exyconn/i18n';
import { withParam } from '@exyconn/shell/utils/searchParams';
import { useFxRatesQuery } from '@exyconn/shell/graphql/generated';
import { BASE_CURRENCY, DEFAULT_USAGE_DAYS, USAGE_WINDOWS } from './usage.providers';

const DAYS_PARAM = 'days';
const CURRENCY_PARAM = 'currency';
const WINDOWS: ReadonlySet<number> = new Set(USAGE_WINDOWS);

/**
 * What the usage screens show: the window (days) and the currency, both in the URL so a link
 * opens the same view, and every USD cost converted at the newest daily rate. A currency with no
 * rate falls back to the company's own, then to US dollars.
 */
export function useUsageView() {
  const [params, setParams] = useSearchParams();
  const { settings } = useI18n();
  const { formatCurrency } = useFormatters();
  const fx = useFxRatesQuery({ fetchPolicy: 'cache-first' });

  const rates = useMemo(
    () => new Map((fx.data?.fxRates.rates ?? []).map((rate) => [rate.currency, rate.rate])),
    [fx.data],
  );
  const asked = Number(params.get(DAYS_PARAM));
  const days = WINDOWS.has(asked) ? asked : DEFAULT_USAGE_DAYS;
  const wanted = params.get(CURRENCY_PARAM) ?? settings.currency ?? BASE_CURRENCY;
  const currency = rates.has(wanted) ? wanted : BASE_CURRENCY;
  const rate = rates.get(currency) ?? 1;

  const setDays = useCallback(
    (value: number) => setParams((current) => withParam(current, DAYS_PARAM, String(value))),
    [setParams],
  );
  const setCurrency = useCallback(
    (value: string) => setParams((current) => withParam(current, CURRENCY_PARAM, value)),
    [setParams],
  );
  /** A USD amount in the chosen currency, formatted. */
  const money = useCallback(
    (usd: number) => formatCurrency(usd * rate, { currency }),
    [formatCurrency, rate, currency],
  );

  return {
    days,
    setDays,
    currency,
    setCurrency,
    currencies: rates.size > 0 ? [...rates.keys()] : [BASE_CURRENCY],
    rateDate: fx.data?.fxRates.date ?? '',
    money,
  };
}

export type UsageView = ReturnType<typeof useUsageView>;
