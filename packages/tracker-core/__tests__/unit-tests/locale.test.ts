import { describe, it, expect } from 'vitest';
import { canonicalLocale, deviceLocale, effectiveLocale } from '../../src/locale';

describe('canonicalLocale', () => {
  it('agrees with the portal on what one language is', () => {
    // The portal canonicalises the same way. If the two disagreed, an employee whose profile
    // says `en_US` would be asked for one catalogue and shown another.
    expect(canonicalLocale('EN-us')).toBe('en-US');
    expect(canonicalLocale('en_US')).toBe('en-US');
    expect(canonicalLocale('hi')).toBe('hi');
  });

  it('rejects what no runtime can resolve, and the "never picked" empty value', () => {
    expect(canonicalLocale('not a language')).toBeNull();
    expect(canonicalLocale('')).toBeNull();
    expect(canonicalLocale(null)).toBeNull();
  });
});

describe('deviceLocale', () => {
  it('always resolves to a tag that can actually format', () => {
    expect(canonicalLocale(deviceLocale())).not.toBeNull();
  });
});

describe('effectiveLocale', () => {
  it('uses the language the portal resolved for this employee', () => {
    // The portal has already applied the chain (their pick → the house default → the locale
    // this machine reported at sign-in). Whatever it hands back is what the app reads in.
    expect(effectiveLocale('hi')).toBe('hi');
    expect(effectiveLocale('pt-BR')).toBe('pt-BR');
  });

  it('falls back to this machine while nobody is signed in', () => {
    // Signed out there is no portal answer at all, and the login screen still needs words.
    expect(effectiveLocale('')).toBe(deviceLocale());
    expect(effectiveLocale(null)).toBe(deviceLocale());
    expect(effectiveLocale(undefined)).toBe(deviceLocale());
  });

  it('falls back rather than trusting a tag this runtime cannot resolve', () => {
    // The tag arrives over the network and is only as good as whatever the portal stored.
    // A tag Intl throws on would take every formatter in the app down with it.
    expect(effectiveLocale('not a language')).toBe(deviceLocale());
  });
});
