import { describe, it, expect } from 'vitest';
import {
  EMPTY_FILTERS,
  toApiFilters,
} from '../../src/components/ui/ImageUploadDialog/pexels-filters';

describe('toApiFilters', () => {
  it('sends nothing but nulls while every dropdown is on "Any"', () => {
    expect(toApiFilters('photos', EMPTY_FILTERS)).toEqual({
      orientation: null,
      size: null,
      color: null,
    });
  });

  it('passes shape, size and colour through for a photo search', () => {
    const filters = { ...EMPTY_FILTERS, orientation: 'portrait', size: 'large', color: 'blue' };
    expect(toApiFilters('photos', filters)).toEqual({
      orientation: 'portrait',
      size: 'large',
      color: 'blue',
    });
  });

  it('turns a length band into the seconds a video search takes, and drops colour', () => {
    const filters = {
      ...EMPTY_FILTERS,
      orientation: 'landscape',
      color: 'red',
      duration: 'medium',
    };
    expect(toApiFilters('videos', filters)).toEqual({
      orientation: 'landscape',
      size: null,
      minDuration: 15,
      maxDuration: 60,
    });
  });

  it('leaves the open end of a band unbounded', () => {
    expect(toApiFilters('videos', { ...EMPTY_FILTERS, duration: 'long' })).toMatchObject({
      minDuration: 60,
      maxDuration: null,
    });
  });
});
