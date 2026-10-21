export declare const PERMISSIONS: string[];
export declare const MEET_MATCH: string;
export declare const ICON_SIZES: number[];
export declare const MIN_CHROME_VERSION: string;
export interface Manifest {
  manifest_version: number;
  name: string;
  version: string;
  key?: string;
  [field: string]: unknown;
}
export declare function buildManifest(input: {
  version: string;
  versionName?: string;
  apiUrl: string;
  key?: string;
}): Manifest;
export declare function storeManifest(manifest: Manifest): Manifest;
