/**
 * Hard ceilings on what an estimate may hold. They bound the work a crafted import or a shared
 * estimate can cause (the engine walks every line for every month) and the size of what is
 * stored in a browser or on the server.
 */
export const LIMITS = {
  /** The engine always projects this many months; the forecast window is a view of it. */
  months: 60,
  /** INR 1 lakh crore: far above any GCC budget, well inside exact integer paise. */
  amount: 1e12,
  quantity: 1e6,
  headcount: 20_000,
  roles: 300,
  lines: 400,
  categories: 100,
  subscriptions: 50,
  expansions: 24,
  scenarios: 6,
  currencies: 20,
  /** Bytes of JSON accepted by import and by the server. */
  payloadBytes: 1_000_000,
} as const;
