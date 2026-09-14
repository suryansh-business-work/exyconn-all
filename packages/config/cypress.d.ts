import type { ConfigOptions, PluginEvents } from "cypress";

/** Cypress component-testing config shared by every portal package. */
export declare function portalCypressConfig(): ConfigOptions;

/** Registers the `a11yRecord` task that writes axe results to `cypress/a11y/report.jsonl`. */
export declare function registerA11yTasks(on: PluginEvents): void;
