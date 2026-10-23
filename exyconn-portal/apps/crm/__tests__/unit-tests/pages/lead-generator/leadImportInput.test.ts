import { describe, expect, it } from 'vitest';
import { LeadImportStatus } from '@exyconn/shell/graphql/generated';
import {
  CHUNK,
  addResult,
  chunksOf,
  companiesOf,
  emptyResult,
  mergeListOf,
  toInput,
} from '../../../../src/pages/lead-generator/leadImportInput';
import { foundLookup, importResult, leadPlace, preview } from './lead-fixtures';

describe('chunksOf', () => {
  it('returns no batches for an empty list', () => {
    expect(chunksOf([])).toEqual([]);
  });

  it('splits a list into batches of the server size, the last one holding the rest', () => {
    const items = Array.from({ length: CHUNK * 2 + 5 }, (_, i) => i);

    const chunks = chunksOf(items);

    expect(chunks.map((chunk) => chunk.length)).toEqual([CHUNK, CHUNK, 5]);
    expect(chunks.flat()).toEqual(items);
  });
});

describe('toInput', () => {
  it('maps a place and its found emails onto the import input', () => {
    const place = leadPlace();

    expect(toInput(place, foundLookup(['hi@smile.example']))).toEqual({
      placeId: 'place-1',
      name: 'Smile Dental',
      phone: place.phone,
      website: place.website,
      address: place.address,
      city: 'Pune',
      country: 'India',
      lat: place.lat,
      lng: place.lng,
      mapUrl: place.mapUrl,
      emails: ['hi@smile.example'],
      primaryType: 'Dentist',
    });
  });

  it('sends no emails when the website was never looked up or is still being read', () => {
    expect(toInput(leadPlace(), undefined).emails).toEqual([]);
    expect(toInput(leadPlace(), { status: 'PENDING' }).emails).toEqual([]);
  });
});

describe('mergeListOf', () => {
  const extra = (placeId: string, existingCompanyId: string | null) =>
    preview({ placeId, status: LeadImportStatus.DuplicateWithExtra, existingCompanyId });

  it('merges only chosen duplicates that have extra details and a known company', () => {
    const previews = [
      extra('chosen', 'company-1'),
      extra('not-chosen', 'company-2'),
      extra('no-company', null),
      preview({
        placeId: 'plain-duplicate',
        status: LeadImportStatus.Duplicate,
        existingCompanyId: 'company-3',
      }),
      preview({ placeId: 'new' }),
    ];
    const chosen = new Set(['chosen', 'no-company', 'plain-duplicate', 'new']);

    expect(mergeListOf(previews, chosen)).toEqual([{ placeId: 'chosen', companyId: 'company-1' }]);
  });

  it('merges nothing for "Add new only"', () => {
    expect(mergeListOf([extra('chosen', 'company-1')], new Set())).toEqual([]);
  });
});

describe('addResult', () => {
  it('adds each call to the running total', () => {
    const total = emptyResult();
    addResult(total, importResult({ created: 2, filed: [{ placeId: 'a', companyId: 'c-a' }] }));
    addResult(
      total,
      importResult({
        created: 1,
        merged: 1,
        skipped: 1,
        merges: [{ placeId: 'b', companyId: 'c-b', name: 'B', added: [] }],
        skips: [{ placeId: 'c', name: 'C', reason: 'Duplicate', companyId: null }],
        websitesDropped: [{ placeId: 'd', name: 'D', website: 'https://d.test', reason: '404' }],
      }),
    );

    expect(total).toEqual({
      created: 3,
      merged: 1,
      skipped: 1,
      filed: [{ placeId: 'a', companyId: 'c-a' }],
      merges: [{ placeId: 'b', companyId: 'c-b', name: 'B', added: [] }],
      skips: [{ placeId: 'c', name: 'C', reason: 'Duplicate', companyId: null }],
      websitesDropped: [{ placeId: 'd', name: 'D', website: 'https://d.test', reason: '404' }],
    });
  });

  it('starts every total from zero', () => {
    const first = emptyResult();
    first.filed.push({ placeId: 'a', companyId: 'c-a' });

    expect(emptyResult()).toEqual(importResult());
  });
});

describe('companiesOf', () => {
  it('lists filed, updated and known-duplicate places with their company', () => {
    const result = importResult({
      filed: [{ __typename: 'LeadImportFiled', placeId: 'a', companyId: 'c-a' }],
      merges: [{ placeId: 'b', companyId: 'c-b', name: 'B', added: [] }],
      skips: [
        { placeId: 'c', name: 'C', reason: 'Already in the CRM', companyId: 'c-c' },
        { placeId: 'd', name: 'D', reason: 'No name', companyId: null },
      ],
    });

    expect(companiesOf(result)).toEqual([
      { placeId: 'a', companyId: 'c-a' },
      { placeId: 'b', companyId: 'c-b' },
      { placeId: 'c', companyId: 'c-c' },
    ]);
  });
});
