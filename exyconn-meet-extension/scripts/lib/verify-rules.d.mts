import type { Manifest } from './manifest.mjs';

export declare function versionErrors(version: unknown): string[];
export declare function referencedFiles(manifest: Record<string, unknown>): string[];
export declare function manifestErrors(
  manifest: Manifest | Record<string, unknown>,
  options: { exists: (path: string) => boolean; production: boolean },
): string[];
export declare const FORBIDDEN_PATTERNS: Array<{ name: string; pattern: RegExp }>;
export declare function bundleErrors(
  file: string,
  text: string,
  options: { production: boolean },
): string[];
