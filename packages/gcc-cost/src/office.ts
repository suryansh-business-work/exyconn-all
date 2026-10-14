import { charge, escalation, monthRange, plainMeta, type Charge, type ChargeMeta } from './charges';
import { LIMITS } from './limits';
import { percentOf, toMinor } from './money';
import type { Assumptions, Office } from './schema';

const SEAT_PRICED = new Set<Office['model']>(['coworking', 'managed']);

/** Seats available in `month`: the opening seats plus every expansion due by then. */
export function seatsAt(office: Office, month: number): number {
  return office.expansions
    .filter((expansion) => expansion.month <= month)
    .reduce((seats, expansion) => seats + expansion.seats, office.seats);
}

/** Seats the team needs at a given headcount, given how much of it is in the office at once. */
export function seatsNeeded(headcount: number, utilisationPct: number): number {
  return Math.ceil((headcount * utilisationPct) / 100);
}

const meta = (id: string, group: string, label: string): ChargeMeta =>
  plainMeta(`office-${id}`, 'office', group, label);

/** Rent (or seat price) and building charges for the seats in use, before escalation. */
function monthlyOccupancy(office: Office, seats: number): [string, string, number][] {
  if (SEAT_PRICED.has(office.model)) {
    return [['seats', 'Seat charges', seats * office.seatPriceMonthly]];
  }
  const area = seats * office.areaPerSeatSqft;
  return [
    ['rent', 'Rent', area * office.rentPerSqftMonthly],
    ['cam', 'CAM and building charges', area * office.camPerSqftMonthly],
  ];
}

const RUNNING_COSTS = [
  ['internet', 'Internet and networking', 'internetMonthly'],
  ['utilities', 'Electricity and utilities', 'utilitiesMonthly'],
  ['housekeeping', 'Housekeeping and security', 'housekeepingSecurityMonthly'],
  ['transport', 'Parking, transport and insurance', 'transportParkingInsuranceMonthly'],
] as const;

function monthCharges(office: Office, month: number, tax: number): Charge[] {
  const factor = escalation(office.rentEscalationPct, month);
  const occupancy = monthlyOccupancy(office, seatsAt(office, month)).map(
    ([id, label, rupees]) => [id, label, rupees * factor] as const,
  );
  const running = RUNNING_COSTS.map(
    ([id, label, field]) => [id, label, office[field] * factor] as const,
  );
  return [...occupancy, ...running].flatMap(([id, label, rupees]) => {
    const amount = toMinor(rupees);
    return charge(meta(id, 'Occupancy', label), month, 'operating', amount, percentOf(amount, tax));
  });
}

/** Fit-out and the refundable deposit for seats added in `month` (the opening seats in month 1). */
function seatAdditionCharges(office: Office, month: number, added: number, tax: number): Charge[] {
  if (added <= 0) {
    return [];
  }
  const occupancy = monthlyOccupancy(office, added).reduce(
    (total, [, , rupees]) => total + rupees,
    0,
  );
  const deposit = toMinor(
    occupancy * escalation(office.rentEscalationPct, month) * office.depositMonths,
  );
  const fitout = SEAT_PRICED.has(office.model)
    ? 0
    : toMinor(added * office.areaPerSeatSqft * office.fitoutPerSqft);
  return [
    ...charge(meta('deposit', 'Deposits', 'Security deposit'), month, 'deposit', deposit),
    ...charge(meta('fitout', 'Setup', 'Fit-out'), month, 'setup', fitout, percentOf(fitout, tax)),
  ];
}

/**
 * Office charges for the whole projection. A remote-first office has none. Coworking and
 * managed offices are priced per seat and have no fit-out; leased and dedicated space is priced
 * per square foot. Deposits are held against the occupancy cost and are refundable.
 */
export function officeCharges(office: Office, assumptions: Assumptions): Charge[] {
  if (office.model === 'remote-first') {
    return [];
  }
  const tax = assumptions.officeTaxPct;
  const furniture = toMinor(office.furnitureSetup);
  const opening = [
    ...charge(
      meta('furniture', 'Setup', 'Furniture and meeting rooms'),
      1,
      'setup',
      furniture,
      percentOf(furniture, tax),
    ),
    ...seatAdditionCharges(office, 1, office.seats, tax),
  ];
  const expansions = office.expansions.flatMap((expansion) =>
    seatAdditionCharges(office, expansion.month, expansion.seats, tax),
  );
  const running = monthRange(1, LIMITS.months).flatMap((month) => monthCharges(office, month, tax));
  return [...opening, ...expansions, ...running];
}
