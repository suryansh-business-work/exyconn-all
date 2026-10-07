import jwt from 'jsonwebtoken';
import { env } from '../../../src/config/env';
import { ROLES } from '../../../src/constants/roles';
import {
  signDeviceToken,
  signMfaChallenge,
  signToken,
  verifyMfaChallenge,
  verifyToken,
  type TokenPayload,
} from '../../../src/utils/jwt';

const payload: TokenPayload = {
  id: 'user-1',
  roles: [ROLES.EMPLOYEE],
  email: 'asha@acme.test',
  organizationId: 'org-1',
  tv: 2,
  sid: 'session-1',
};

const otherSecret = () => `${env.jwtSecret}-other`;

describe('MFA challenges', () => {
  it('round-trips the user a challenge stands for', () => {
    expect(verifyMfaChallenge(signMfaChallenge('user-9'))).toBe('user-9');
  });

  it('gives every challenge its own id and a five-minute life', () => {
    const first = jwt.decode(signMfaChallenge('user-9'), { json: true });
    const second = jwt.decode(signMfaChallenge('user-9'), { json: true });
    expect(first?.jti).not.toBe(second?.jti);
    expect((first?.exp ?? 0) - (first?.iat ?? 0)).toBe(300);
    expect(first?.aud).toBe('portal-mfa');
  });

  it('refuses a session token presented as a challenge', () => {
    expect(verifyMfaChallenge(signToken(payload))).toBeNull();
  });

  it('refuses an expired challenge, a forged one and garbage', () => {
    const options = { issuer: 'exyconn-portal', audience: 'portal-mfa' };
    const expired = jwt.sign({ id: 'user-9' }, env.jwtSecret, { ...options, expiresIn: -10 });
    const forged = jwt.sign({ id: 'user-9' }, otherSecret(), { ...options, expiresIn: 60 });
    expect(verifyMfaChallenge(expired)).toBeNull();
    expect(verifyMfaChallenge(forged)).toBeNull();
    expect(verifyMfaChallenge('not-a-token')).toBeNull();
  });

  it('answers null for a live challenge that names nobody', () => {
    const anonymous = jwt.sign({}, env.jwtSecret, {
      issuer: 'exyconn-portal',
      audience: 'portal-mfa',
      expiresIn: 60,
    });
    expect(verifyMfaChallenge(anonymous)).toBeNull();
  });
});

describe('portal session tokens', () => {
  it('verifies back to the payload it was signed with', () => {
    const claims = verifyToken(signToken(payload));
    expect(claims).toMatchObject(payload);
  });

  it('is never accepted as an MFA challenge or with another secret', () => {
    const token = jwt.sign({ ...payload }, otherSecret(), {
      issuer: 'exyconn-portal',
      audience: 'portal',
    });
    expect(verifyToken(token)).toBeNull();
    expect(verifyToken(signMfaChallenge('user-1'))).toBeNull();
  });

  it('refuses garbage', () => {
    expect(verifyToken('a.b.c')).toBeNull();
    expect(verifyToken('')).toBeNull();
  });
});

describe('device tokens', () => {
  it('verifies a device token for the tracker audience', () => {
    const token = signDeviceToken({ ...payload, deviceId: 'device-1' });
    expect(jwt.decode(token, { json: true })?.exp).toBeUndefined();
    expect(verifyToken(token)).toMatchObject({ deviceId: 'device-1', id: 'user-1' });
  });

  it('refuses a portal-audience token that claims a device', () => {
    const token = jwt.sign({ ...payload, deviceId: 'device-1' }, env.jwtSecret, {
      issuer: 'exyconn-portal',
      audience: 'portal',
    });
    expect(verifyToken(token)).toBeNull();
  });

  it('refuses a device token whose deviceId is not a string, as a portal token', () => {
    const token = jwt.sign({ ...payload, deviceId: 7 }, env.jwtSecret, {
      issuer: 'exyconn-portal',
      audience: 'tracker-device',
    });
    expect(verifyToken(token)).toBeNull();
  });
});

describe('legacy tokens', () => {
  it('accepts a token with neither issuer nor audience, with the algorithm still pinned', () => {
    const legacy = jwt.sign({ ...payload }, env.jwtSecret, { algorithm: 'HS256' });
    expect(verifyToken(legacy)).toMatchObject({ id: 'user-1' });
    const otherAlgorithm = jwt.sign({ ...payload }, env.jwtSecret, { algorithm: 'HS512' });
    expect(verifyToken(otherAlgorithm)).toBeNull();
  });

  it('checks the audience when only an audience is present', () => {
    const audienceOnly = jwt.sign({ ...payload }, env.jwtSecret, { audience: 'portal' });
    expect(verifyToken(audienceOnly)).toBeNull();
  });
});
