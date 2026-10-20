import { endOfDay, formatISO, isValid, parseISO, startOfDay } from 'date-fns';
import {
  MaLanguage,
  MaMeetingStatus,
  type MaDashboardFilter,
} from '@exyconn/shell/graphql/generated';
import { toMaScope, type MeetingScope } from '../lib/scope';

/** The URL search params the dashboard filters live in, so a filtered view can be shared. */
export const FILTER_PARAMS = {
  from: 'from',
  to: 'to',
  organizer: 'organizer',
  participant: 'participant',
  status: 'status',
  language: 'language',
} as const;

export type FilterParam = (typeof FILTER_PARAMS)[keyof typeof FILTER_PARAMS];

/** A calendar day from a `from`/`to` param (`2026-10-20`), or null when absent or not a day. */
export function paramDay(value: string | null): Date | null {
  if (!value) {
    return null;
  }
  const day = parseISO(value);
  return isValid(day) ? day : null;
}

/** A picked day as the URL keeps it (ISO calendar date), or null when cleared or half-typed. */
export function dayParam(day: Date | null): string | null {
  if (!day || !isValid(day)) {
    return null;
  }
  return formatISO(day, { representation: 'date' });
}

const statusOf = (value: string | null) =>
  Object.values(MaMeetingStatus).find((status) => status === value);

const languageOf = (value: string | null) =>
  Object.values(MaLanguage).find((language) => language === value);

/**
 * The dashboard query's filter from the URL. Anything that is not a real day or enum value is
 * dropped rather than sent; the organizer only narrows the company-wide view.
 */
export function toDashboardFilter(params: URLSearchParams, scope: MeetingScope): MaDashboardFilter {
  const from = paramDay(params.get(FILTER_PARAMS.from));
  const to = paramDay(params.get(FILTER_PARAMS.to));
  return {
    scope: toMaScope(scope),
    from: from ? startOfDay(from).toISOString() : undefined,
    to: to ? endOfDay(to).toISOString() : undefined,
    ownerId: scope === 'ALL' ? (params.get(FILTER_PARAMS.organizer) ?? undefined) : undefined,
    participantUserId: params.get(FILTER_PARAMS.participant) ?? undefined,
    status: statusOf(params.get(FILTER_PARAMS.status)),
    language: languageOf(params.get(FILTER_PARAMS.language)),
  };
}
