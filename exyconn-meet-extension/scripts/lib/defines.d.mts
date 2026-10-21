export interface ModeConfig {
  apiUrl: string;
  portalUrl: string;
}
export declare const MODES: Record<string, ModeConfig>;
export declare const PACKAGE_VERSION: string;
export declare function modeConfig(mode: string): ModeConfig;
export declare function defineConstants(mode: string): Record<string, string>;
