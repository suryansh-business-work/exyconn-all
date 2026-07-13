import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

export interface HealthConfig {
  name: string;
  version: string;
  port: string | number;
  domain: string;
  description: string;
  uiUrl: string;
  serverUrl: string;
  criticalPackages?: string[];
}

export interface RootConfig extends HealthConfig {
  endpoints: Record<string, string>;
}

interface PackageInfo {
  name: string;
  version: string;
  status: 'ok' | 'not-found';
}

function getPackageVersion(packageName: string): PackageInfo {
  try {
    const packageJsonPath = path.join(
      process.cwd(),
      'node_modules',
      packageName,
      'package.json'
    );
    if (fs.existsSync(packageJsonPath)) {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      return { name: packageName, version: pkg.version, status: 'ok' };
    }
    return { name: packageName, version: 'not-found', status: 'not-found' };
  } catch {
    return { name: packageName, version: 'error', status: 'not-found' };
  }
}

export function createHealthHandler(config: HealthConfig) {
  return (_req: Request, res: Response) => {
    const packages = (config.criticalPackages || []).map(getPackageVersion);
    const allHealthy = packages.every(p => p.status === 'ok');

    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: {
        name: config.name,
        version: config.version,
        description: config.description,
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        port: config.port,
      },
      packages,
      links: {
        ui: config.uiUrl,
        api: config.serverUrl,
      },
    });
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
