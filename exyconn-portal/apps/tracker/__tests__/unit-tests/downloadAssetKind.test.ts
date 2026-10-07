import { describe, expect, it } from 'vitest';
import { assetKind, orderAssets } from '../../src/pages/download/assetKind';

describe('assetKind', () => {
  it('offers the APK as the phone download and the AAB as the Play Store bundle', () => {
    expect(assetKind('Exyconn-Tracker-1.9.9.apk', 'Android')).toMatchObject({
      label: 'Download APK',
      primary: true,
    });
    expect(assetKind('Exyconn-Tracker-1.9.9.aab', 'Android')).toMatchObject({
      label: 'Download AAB',
      primary: false,
    });
  });

  it('says the IPA is unsigned', () => {
    const kind = assetKind('Exyconn-Tracker-1.9.9-unsigned.ipa', 'iOS');
    expect(kind.label).toBe('Download IPA');
    expect(kind.caption).toContain('Unsigned');
  });

  it('keeps a desktop installer as one plain download', () => {
    expect(assetKind('Exyconn Tracker-Setup-1.9.9.exe', 'Windows')).toEqual({
      label: 'Download for Windows',
      caption: '',
      primary: true,
    });
  });

  it('reads the extension case-insensitively and treats a name without one as an installer', () => {
    expect(assetKind('EXYCONN-TRACKER.APK', 'Android').label).toBe('Download APK');
    expect(assetKind('exyconn-tracker', 'Linux')).toEqual({
      label: 'Download for Linux',
      caption: '',
      primary: true,
    });
  });
});

describe('orderAssets', () => {
  it('puts the file most people want first', () => {
    const files = [{ name: 'Exyconn-Tracker-1.9.9.aab' }, { name: 'Exyconn-Tracker-1.9.9.apk' }];
    expect(orderAssets(files, 'Android').map((file) => file.name)).toEqual([
      'Exyconn-Tracker-1.9.9.apk',
      'Exyconn-Tracker-1.9.9.aab',
    ]);
  });

  it('returns a sorted copy and leaves the release list as it came', () => {
    const files = [{ name: 'Exyconn-Tracker-1.9.9.aab' }, { name: 'Exyconn-Tracker-1.9.9.apk' }];
    const ordered = orderAssets(files, 'Android');

    expect(ordered).not.toBe(files);
    expect(files[0].name).toBe('Exyconn-Tracker-1.9.9.aab');
  });
});
