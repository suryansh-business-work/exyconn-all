/** How one downloadable file is offered: its button, the line under it, and its weight. */
export interface AssetKind {
  label: string;
  caption: string;
  /** The file most people want — drawn as the filled button, and listed first. */
  primary: boolean;
}

/**
 * The files a platform can have more than one of, told apart by extension. Android ships two:
 * the APK that installs on a phone, and the bundle an administrator uploads to Google Play —
 * which a phone cannot install, so it must never look like the download to pick.
 */
const KINDS: Readonly<Record<string, AssetKind>> = {
  '.apk': {
    label: 'Download APK',
    caption: 'Installs straight on an Android phone.',
    primary: true,
  },
  '.aab': {
    label: 'Download AAB',
    caption: 'Android App Bundle for the Google Play Console — a phone cannot install it.',
    primary: false,
  },
  '.ipa': {
    label: 'Download IPA',
    caption: 'Unsigned — installs on an iPhone only after it has been re-signed.',
    primary: true,
  },
};

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot < 0 ? '' : fileName.slice(dot).toLowerCase();
}

/** The button for one file; a desktop installer is simply "Download for <platform>". */
export function assetKind(fileName: string, platformLabel: string): AssetKind {
  return (
    KINDS[extensionOf(fileName)] ?? {
      label: `Download for ${platformLabel}`,
      caption: '',
      primary: true,
    }
  );
}

/** The platform's files, the one most people want first. */
export function orderAssets<T extends { name: string }>(
  assets: readonly T[],
  platformLabel: string,
): T[] {
  // A copy, sorted: the portal's ES2021 target has no toSorted().
  return [...assets].sort(
    (a, b) =>
      Number(assetKind(b.name, platformLabel).primary) -
      Number(assetKind(a.name, platformLabel).primary),
  );
}
