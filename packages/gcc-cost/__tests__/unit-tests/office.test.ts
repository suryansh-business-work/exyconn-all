import { describe, expect, it } from 'vitest';
import { officeCharges, seatsAt, seatsNeeded, type Charge } from '../../src';
import { assumptions, office } from './fixtures';

const byLabel = (charges: Charge[], label: string, month: number) =>
  charges.filter((item) => item.label === label && item.month === month);

describe('office', () => {
  it('costs nothing when remote-first', () => {
    expect(
      officeCharges(office({ model: 'remote-first', furnitureSetup: 1_000 }), assumptions()),
    ).toEqual([]);
  });

  it('prices coworking per seat with a refundable deposit and no fit-out', () => {
    const charges = officeCharges(
      office({
        model: 'coworking',
        seats: 10,
        seatPriceMonthly: 10_000,
        depositMonths: 2,
        fitoutPerSqft: 1_000,
      }),
      assumptions(),
    );
    expect(byLabel(charges, 'Seat charges', 5)[0].amount).toBe(10_000_000);
    const [deposit] = byLabel(charges, 'Security deposit', 1);
    expect(deposit).toMatchObject({ kind: 'deposit', amount: 20_000_000, tax: 0 });
    expect(charges.some((item) => item.label === 'Fit-out')).toBe(false);
  });

  it('prices leased space per square foot with fit-out as a one-time setup cost', () => {
    const charges = officeCharges(
      office({
        model: 'leased',
        seats: 10,
        areaPerSeatSqft: 100,
        rentPerSqftMonthly: 100,
        camPerSqftMonthly: 10,
        fitoutPerSqft: 2_000,
        furnitureSetup: 50_000,
        depositMonths: 6,
      }),
      assumptions({ officeTaxPct: 18 }),
    );
    expect(byLabel(charges, 'Rent', 1)[0]).toMatchObject({ amount: 10_000_000, tax: 1_800_000 });
    expect(byLabel(charges, 'CAM and building charges', 1)[0].amount).toBe(1_000_000);
    const fitout = charges.filter((item) => item.label === 'Fit-out');
    expect(fitout).toHaveLength(1);
    expect(fitout[0]).toMatchObject({ kind: 'setup', month: 1, amount: 200_000_000 });
    expect(byLabel(charges, 'Furniture and meeting rooms', 1)[0].kind).toBe('setup');
    // six months of rent + CAM, never charged again
    expect(charges.filter((item) => item.kind === 'deposit')).toHaveLength(1);
    expect(byLabel(charges, 'Security deposit', 1)[0].amount).toBe(66_000_000);
  });

  it('adds seats, fit-out and deposit at each expansion and escalates rent yearly', () => {
    const leased = office({
      model: 'dedicated',
      seats: 10,
      fitoutPerSqft: 1_000,
      depositMonths: 1,
      rentEscalationPct: 5,
      internetMonthly: 1_000,
      expansions: [{ id: 'exp-1', month: 13, seats: 5 }],
    });
    expect(seatsAt(leased, 12)).toBe(10);
    expect(seatsAt(leased, 13)).toBe(15);
    const charges = officeCharges(leased, assumptions());
    expect(byLabel(charges, 'Rent', 13)[0].amount).toBe(15_750_000);
    expect(byLabel(charges, 'Fit-out', 13)[0].amount).toBe(50_000_000);
    expect(byLabel(charges, 'Security deposit', 13)[0].amount).toBe(5_250_000);
    expect(byLabel(charges, 'Internet and networking', 13)[0].amount).toBe(105_000);
  });

  it('charges no deposit or fit-out for an office that opens with no seats', () => {
    const charges = officeCharges(
      office({ model: 'leased', seats: 0, depositMonths: 2, fitoutPerSqft: 100 }),
      assumptions(),
    );
    expect(charges.filter((item) => item.kind !== 'operating')).toEqual([]);
  });

  it('suggests seats from headcount and utilisation', () => {
    expect(seatsNeeded(25, 60)).toBe(15);
    expect(seatsNeeded(0, 60)).toBe(0);
  });
});
