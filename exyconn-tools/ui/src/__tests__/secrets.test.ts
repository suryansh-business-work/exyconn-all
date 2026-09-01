import { describe, it, expect, beforeEach } from 'vitest';
import { readSecret, writeSecret, hasSecret } from '../shared/services/secrets';

/**
 * The Google Maps/Places keys are stored inside the Lead Generator settings
 * blob rather than under their own localStorage entry. These tests pin the
 * round-trip so a drawer write stays visible to the tools that read it.
 */
describe('secrets service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('round-trips a plain key', () => {
    writeSecret('openai_api_key', 'sk-test-123');
    expect(readSecret('openai_api_key')).toBe('sk-test-123');
    expect(localStorage.getItem('openai_api_key')).toBe('sk-test-123');
  });

  it('round-trips a key held inside the shared settings blob', () => {
    writeSecret('google_places_api_key', 'AIza-places');
    expect(readSecret('google_places_api_key')).toBe('AIza-places');

    const blob = JSON.parse(localStorage.getItem('lead-generator-api-settings') ?? '{}');
    expect(blob.googlePlacesApiKey).toBe('AIza-places');
  });

  it('keeps both blob keys independent', () => {
    writeSecret('google_maps_api_key', 'AIza-maps');
    writeSecret('google_places_api_key', 'AIza-places');

    expect(readSecret('google_maps_api_key')).toBe('AIza-maps');
    expect(readSecret('google_places_api_key')).toBe('AIza-places');
  });

  it('does not clobber the sibling key when one is cleared', () => {
    writeSecret('google_maps_api_key', 'AIza-maps');
    writeSecret('google_places_api_key', 'AIza-places');
    writeSecret('google_places_api_key', '');

    expect(readSecret('google_maps_api_key')).toBe('AIza-maps');
    expect(readSecret('google_places_api_key')).toBe('');
  });

  it('returns empty string for unknown or unset keys', () => {
    expect(readSecret('openai_api_key')).toBe('');
    expect(readSecret('not_a_real_key')).toBe('');
  });

  it('survives a corrupt settings blob', () => {
    localStorage.setItem('lead-generator-api-settings', '{not json');
    expect(readSecret('google_places_api_key')).toBe('');
  });

  it('hasSecret ignores whitespace-only values', () => {
    writeSecret('openai_api_key', '   ');
    expect(hasSecret('openai_api_key')).toBe(false);

    writeSecret('openai_api_key', 'sk-real');
    expect(hasSecret('openai_api_key')).toBe(true);
  });
});
