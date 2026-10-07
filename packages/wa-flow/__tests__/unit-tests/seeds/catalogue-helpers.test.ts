/**
 * The pricing and labelling helpers behind the seed catalogues: hotel GST slabs, the home-loan
 * EMI, fitness GST, civic fee labels, practice-area variables, breed slugs and menu rows, plus
 * the schedule and stay-length rows the workflows build from them.
 */
import { describe, expect, it } from 'vitest';
import type { AuthorNode, SeedWorkflow } from '../../../src/author';
import { gstOn } from '../../../src/seeds/fitness/data';
import { book } from '../../../src/seeds/hotel/book';
import { NIGHTS, ROOMS, roomSet, stayPrice } from '../../../src/seeds/hotel/data';
import { areaVars, PRACTICE_AREAS } from '../../../src/seeds/legal/data';
import { slugOf } from '../../../src/seeds/pet-care/data';
import { vaccination } from '../../../src/seeds/pet-care/vaccination';
import { ALL_SERVICES, serviceRow } from '../../../src/seeds/public-services/data';
import { emi, LOAN_RATE } from '../../../src/seeds/real-estate/data';
import { toRows } from '../../../src/seeds/restaurant/data';

function nodeIn(workflow: SeedWorkflow, id: string): AuthorNode {
  const node = workflow.nodes.find((n) => n.id === id);
  if (!node) {
    throw new Error(`No node ${id} in ${workflow.key}`);
  }
  return node;
}

describe('hotel stay prices', () => {
  const [garden] = ROOMS;

  it('charges 12% GST up to ₹7,500 a night, after the 10% prepaid saving', () => {
    expect(garden.rate).toBeLessThanOrEqual(7500);
    expect(stayPrice(garden, 2)).toEqual({
      roomTotal: garden.rate * 2,
      save: Math.round(garden.rate * 2 * 0.1),
      gst: Math.round((garden.rate * 2 - Math.round(garden.rate * 2 * 0.1)) * 0.12),
      gstLabel: 'GST (12%)',
    });
  });

  it('switches to 18% GST strictly above ₹7,500 a night', () => {
    expect(stayPrice({ ...garden, rate: 7500 }, 1)).toEqual({
      roomTotal: 7500,
      save: 750,
      gst: 810,
      gstLabel: 'GST (12%)',
    });
    expect(stayPrice({ ...garden, rate: 8200 }, 1)).toEqual({
      roomTotal: 8200,
      save: 820,
      gst: 1328,
      gstLabel: 'GST (18%)',
    });
  });

  it('stores the chosen room as text variables', () => {
    expect(roomSet(garden)).toEqual({
      room: garden.name,
      roomKey: garden.key,
      rate: String(garden.rate),
    });
  });

  it('offers one stay-length row per night count, singular for a single night', () => {
    const list = nodeIn(book, `nights-${garden.key}`);
    expect(list.type).toBe('list');
    const rows = list.type === 'list' ? list.data.sections[0].rows : [];
    expect(rows?.map((r) => r.title)).toEqual(
      NIGHTS.map((n) => (n === 1 ? '1 night' : `${n} nights`)),
    );
    const one = stayPrice(garden, 1);
    expect(rows?.[0].set).toEqual({
      nights: '1',
      roomTotal: String(one.roomTotal),
      save: String(one.save),
      gst: String(one.gst),
      gstLabel: one.gstLabel,
    });
    for (const room of ROOMS) {
      expect(nodeIn(book, `nights-${room.key}`).next).toEqual(
        Object.fromEntries(NIGHTS.map((n) => [`n${n}`, 'avail'])),
      );
    }
  });
});

describe('home-loan EMI', () => {
  it('works out the monthly instalment at the indicative rate, to the rupee', () => {
    expect(LOAN_RATE).toBe(8.5);
    expect(emi(5_000_000, 15)).toBe(49237);
    expect(emi(5_000_000, 20)).toBe(43391);
    expect(emi(5_000_000, 25)).toBe(40261);
  });

  it('lowers the instalment for a longer tenure but repays more in total', () => {
    const short = emi(10_000_000, 15);
    const long = emi(10_000_000, 25);
    expect(long).toBeLessThan(short);
    expect(long * 25 * 12).toBeGreaterThan(short * 15 * 12);
    expect(short * 15 * 12).toBeGreaterThan(10_000_000);
  });
});

describe('fitness GST', () => {
  it('adds 18% rounded to the whole rupee, and nothing on a free add-on', () => {
    expect(gstOn(1500)).toBe(270);
    expect(gstOn(2499)).toBe(450);
    expect(gstOn(0)).toBe(0);
  });
});

describe('civic service rows', () => {
  it('labels a paid service with its fee', () => {
    const paid = ALL_SERVICES.find((s) => s.id === 'birth');
    expect(paid?.fee).toBe(50);
    const row = paid ? serviceRow(paid) : undefined;
    expect(row?.description).toBe(`${paid?.description} · ₹50`);
    expect(row?.set).toMatchObject({ fee: '50', feeLabel: '₹50', serviceId: 'birth' });
  });

  it('labels a service without a fee as free', () => {
    const free = ALL_SERVICES.find((s) => s.fee === 0);
    expect(free?.id).toBe('property-tax');
    const row = free ? serviceRow(free) : undefined;
    expect(row?.description).toBe(`${free?.description} · Free`);
    expect(row?.set).toEqual({
      service: free?.title,
      serviceId: free?.id,
      counter: free?.counter,
      fee: '0',
      feeLabel: 'Free',
      timeline: free?.timeline,
    });
  });
});

describe('legal practice areas', () => {
  it('stores the area, its lawyer and the consultation fee as text', () => {
    const [property] = PRACTICE_AREAS;
    expect(areaVars(property)).toEqual({
      area: 'Property & real estate',
      areaKey: 'property',
      lawyer: 'Adv. Rajiv Khanna',
      lawyerTitle: 'Partner · Real estate and RERA',
      fee: '3500',
    });
  });
});

describe('pet breed slugs', () => {
  it('lower-cases a breed and joins every word with a hyphen', () => {
    expect(slugOf('Labrador Retriever')).toBe('labrador-retriever');
    expect(slugOf('Great Dane Mix Breed')).toBe('great-dane-mix-breed');
    expect(slugOf('Indie')).toBe('indie');
  });
});

describe('pet vaccination card', () => {
  it('flags the first dose overdue, the next two due and the rest up to date', () => {
    const card = nodeIn(vaccination, 'dog-card');
    const preview = card.type === 'document' ? card.data.document.preview : undefined;
    const table = preview?.sections.find((s) => s.kind === 'table');
    const rows = table?.kind === 'table' ? table.rows : [];
    expect(rows.map((r) => [r.cells[2], r.flag])).toEqual([
      ['Overdue', 'high'],
      ['Due this month', undefined],
      ['Due this month', undefined],
      ['Up to date', undefined],
      ['Up to date', undefined],
    ]);
  });
});

describe('restaurant menu rows', () => {
  it('numbers each row from one under its prefix and copies the cells', () => {
    const source = [
      ['Dal makhani', 'Slow-cooked black lentils', '₹425'],
      ['Gulab jamun', 'Two pieces, warm', '₹245'],
    ] as const;
    const rows = toRows(source, 'mains');
    expect(rows).toEqual([
      { id: 'mains-1', cells: ['Dal makhani', 'Slow-cooked black lentils', '₹425'] },
      { id: 'mains-2', cells: ['Gulab jamun', 'Two pieces, warm', '₹245'] },
    ]);
    expect(rows[0].cells).not.toBe(source[0]);
    expect(toRows([], 'empty')).toEqual([]);
  });
});
