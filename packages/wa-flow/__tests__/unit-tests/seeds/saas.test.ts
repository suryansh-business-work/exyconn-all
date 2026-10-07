import { describe, expect, it } from 'vitest';
import { saas } from '../../../src/seeds/saas';
import { ENTERPRISE_REP, INTERNATIONAL_REP, REGIONAL_REPS } from '../../../src/seeds/saas/data';
import { checkSeed } from './check-seed';
import { contactNames, documentNames, SeedChat } from './play';

const REGION_IDS = [...REGIONAL_REPS, INTERNATIONAL_REP].map((r) => r.region);

/** Answers the four BANT questions after choosing "Quick questions". */
function qualifyWith(budget: string, authority: string, timeline: string): SeedChat {
  const chat = new SeedChat(saas);
  chat.open('qualify');
  for (const id of ['quick', 'leads', budget, authority, timeline]) {
    chat.pick(id);
  }
  return chat;
}

/** Asks for sales from "Talk to a specialist" and answers region and company size. */
function routeLead(region: string, size: string): string[] {
  const chat = new SeedChat(saas);
  chat.open('routing');
  chat.pick('new');
  chat.pick(region);
  return contactNames(chat.pick(size));
}

describe('saas seed', () => {
  checkSeed(saas, ['demo', 'qualify', 'meeting', 'routing']);

  describe('lead routing', () => {
    it('asks who to talk to when the lead did not come from sales qualification', () => {
      const chat = new SeedChat(saas);
      chat.open('routing');
      expect(chat.options().map((o) => o.id)).toEqual(['new', 'customer', 'partner']);
    });

    it('hands every regional lead under 500 people to that region’s rep', () => {
      for (const rep of REGIONAL_REPS) {
        expect(routeLead(rep.region, 'startup'), rep.region).toEqual([rep.name]);
        expect(routeLead(rep.region, 'mid'), rep.region).toEqual([rep.name]);
      }
    });

    it('sends enterprise leads to the enterprise team whatever the region', () => {
      expect(routeLead('south', 'ent')).toEqual([ENTERPRISE_REP.name]);
      expect(routeLead('intl', 'ent')).toEqual([ENTERPRISE_REP.name]);
    });

    it('falls back to the international rep for teams outside India', () => {
      expect(routeLead('intl', 'mid')).toEqual([INTERNATIONAL_REP.name]);
    });
  });

  describe('BANT scoring', () => {
    it('routes a hot lead straight to the region question, skipping "who to talk to"', () => {
      const chat = qualifyWith('b-small', 'dm', 'month');
      expect(chat.options().map((o) => o.id)).toEqual(REGION_IDS);
      expect(chat.options().every((o) => o.ref.workflow === 'routing')).toBe(true);
      expect(chat.result?.signals).toContainEqual(
        expect.objectContaining({ type: 'FLOW_COMPLETED', workflow: 'qualify' }),
      );
    });

    it('sends pricing to a lead without a budget or without buying authority', () => {
      for (const chat of [
        qualifyWith('b-none', 'dm', 'month'),
        qualifyWith('b-large', 'explorer', 'quarter'),
      ]) {
        expect(documentNames(chat.contents)).toEqual(['Orbitly_Pricing_2026.pdf']);
        expect(chat.options().map((o) => o.id)).toEqual(['demo', 'rep', 'trial']);
      }
    });

    it('scores a late timeline as cold before anything else and schedules a nurture story', () => {
      const chat = qualifyWith('b-none', 'explorer', 'later');
      expect(documentNames(chat.contents)).toEqual(['Orbitly_Buyers_Guide.pdf']);
      expect(chat.result?.scheduled).toEqual([
        expect.objectContaining({ workflow: 'qualify', node: 'n-story' }),
      ]);
    });
  });
});
