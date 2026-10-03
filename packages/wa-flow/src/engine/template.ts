/**
 * `{{var}}` templates and `$fn` set-expressions.
 *
 * A template is translated first (the English source is the @exyconn/i18n key) and filled in
 * after, so the catalogue only ever sees the sentence as written, never one with a name in it.
 */
import type { DummyData } from './dummy';
import type { EngineContext } from './types';

const DAY_MS = 24 * 60 * 60 * 1000;
const PLACEHOLDER = /\{\{\s*([\w.]+)\s*(?:\|\s*(\w+)\s*)?\}\}/g;

export type Scope = Readonly<Record<string, string>>;

/** The chat's variables plus the signed-in user as `user.*`. */
export function scopeOf(vars: Readonly<Record<string, string>>, ctx: EngineContext): Scope {
  return {
    ...vars,
    'user.firstName': ctx.user.firstName,
    'user.fullName': ctx.user.fullName,
    'user.email': ctx.user.email,
    'user.phone': ctx.user.phone,
  };
}

function applyFilter(value: string, filter: string | undefined, ctx: EngineContext): string {
  const number = Number(value);
  switch (filter) {
    case 'money':
      return Number.isFinite(number) ? ctx.format.money(number) : value;
    case 'date':
      return Number.isFinite(number) ? ctx.format.date(number) : value;
    case 'time':
      return Number.isFinite(number) ? ctx.format.time(number) : value;
    case 'day':
      return Number.isFinite(number) ? ctx.format.day(number) : value;
    case 'upper':
      return value.toUpperCase();
    case 'lower':
      return value.toLowerCase();
    default:
      return value;
  }
}

/** Fills `{{name}}` / `{{name|filter}}`. An unknown name is left as written, so it shows. */
export function fill(template: string, scope: Scope, ctx: EngineContext): string {
  return template.replaceAll(PLACEHOLDER, (whole, name: string, filter?: string) => {
    const value = scope[name];
    return value === undefined ? whole : applyFilter(value, filter, ctx);
  });
}

/** Translates, then fills — for every string a customer reads. */
export function say(template: string, scope: Scope, ctx: EngineContext): string {
  return fill(ctx.t(template), scope, ctx);
}

/** Resolves a price written as a number or a `{{var}}` template. */
export function amountOf(value: number | string, scope: Scope, ctx: EngineContext): number {
  if (typeof value === 'number') {
    return value;
  }
  const resolved = Number(fill(value, scope, ctx));
  return Number.isFinite(resolved) ? resolved : 0;
}

/**
 * One `set` value: a template, or a helper —
 * `$id:CC` → "CC-4KQ7W2", `$price:650` / `$price:650:15` → a price near 650 (±15%),
 * `$int:1:9`, `$pick:a|b|c`, `$days:2` → local midnight two days ahead (epoch ms), `$now`.
 */
export function evaluate(raw: string, scope: Scope, ctx: EngineContext, data: DummyData): string {
  const value = fill(raw, scope, ctx);
  if (!value.startsWith('$')) {
    return value;
  }
  const [fn, ...args] = value.slice(1).split(':');
  switch (fn) {
    case 'id':
      return data.id(args[0] ?? 'ID');
    case 'price':
      return String(data.price(Number(args[0]), args[1] ? Number(args[1]) : undefined));
    case 'int':
      return String(data.int(Number(args[0]), Number(args[1])));
    case 'pick':
      return data.pick((args[0] ?? '').split('|'));
    case 'days': {
      const day = new Date(ctx.now + Number(args[0]) * DAY_MS);
      day.setHours(0, 0, 0, 0);
      return String(day.getTime());
    }
    case 'now':
      return String(ctx.now);
    default:
      return value;
  }
}

/** Evaluates a whole `set` map against the scope as it stands. */
export function evaluateAll(
  set: Readonly<Record<string, string>> | undefined,
  scope: Scope,
  ctx: EngineContext,
  data: DummyData,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, raw] of Object.entries(set ?? {})) {
    out[key] = evaluate(raw, { ...scope, ...out }, ctx, data);
  }
  return out;
}
