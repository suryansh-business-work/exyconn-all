import { Request, Response } from 'express';

export interface HealthConfig {
  name: string;
  version: string;
  port: string | number;
  domain: string;
  description: string;
  uiUrl: string;
  serverUrl: string;
}

export interface RootConfig extends HealthConfig {
  endpoints: Record<string, string>;
}

/**
 * Liveness only. Uptime monitors and the container healthcheck need a 200, not the
 * runtime, platform and dependency versions this used to publish to anyone who asked.
 */
export function createHealthHandler() {
  return (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  };
}

export function createRootHandler(config: RootConfig) {
  return (_req: Request, res: Response) => {
    res.json({
      name: config.name,
      version: config.version,
      description: config.description,
      status: 'running',
      timestamp: new Date().toISOString(),
      endpoints: config.endpoints,
      links: {
        ui: config.uiUrl,
        api: config.serverUrl,
        health: `${config.serverUrl}/health`,
      },
    });
  };
}
