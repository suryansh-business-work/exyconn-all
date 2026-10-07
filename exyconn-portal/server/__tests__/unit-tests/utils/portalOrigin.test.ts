import { env } from '../../../src/config/env';
import { portalOrigin } from '../../../src/utils/portalOrigin';

describe('portalOrigin', () => {
  it('honours an origin CORS already trusts', () => {
    const trusted = env.corsOrigins[0];
    expect(trusted).toBeTruthy();
    expect(portalOrigin(trusted)).toBe(trusted);
  });

  it('sends a spoofed origin to the hub instead', () => {
    expect(portalOrigin('https://attacker.example')).toBe(env.portalHubUrl);
  });

  it('sends a request without an origin to the hub', () => {
    expect(portalOrigin()).toBe(env.portalHubUrl);
    expect(portalOrigin('')).toBe(env.portalHubUrl);
  });
});
