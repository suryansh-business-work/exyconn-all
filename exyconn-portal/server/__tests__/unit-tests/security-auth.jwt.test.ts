import jwt from 'jsonwebtoken';
import { signDeviceToken, signToken, verifyToken } from '../../src/utils/jwt';
import { ROLES } from '../../src/constants/roles';

const SECRET = process.env.JWT_SECRET ?? '';
const payload = { id: 'u1', email: 'a@exyconn.com', roles: [ROLES.EMPLOYEE], tv: 3 };

/** The claims inside a token, read without verifying it. */
const claimsOf = (token: string) => jwt.decode(token, { json: true }) ?? {};

describe('portal and device tokens', () => {
  it('signs a portal token with HS256, issuer, audience, a unique id and the token version', () => {
    const token = signToken(payload);
    const header = jwt.decode(token, { complete: true })?.header;

    expect(header?.alg).toBe('HS256');
    expect(claimsOf(token)).toMatchObject({ iss: 'exyconn-portal', aud: 'portal', tv: 3 });
    expect(claimsOf(token).jti).toEqual(expect.any(String));
    expect(claimsOf(signToken(payload)).jti).not.toBe(claimsOf(token).jti);
    expect(verifyToken(token)).toMatchObject({ id: 'u1', tv: 3 });
  });

  it('signs a device token for the tracker audience, with no expiry', () => {
    const token = signDeviceToken({ ...payload, deviceId: 'd1' });

    expect(claimsOf(token)).toMatchObject({ iss: 'exyconn-portal', aud: 'tracker-device' });
    expect(claimsOf(token).exp).toBeUndefined();
    expect(verifyToken(token)).toMatchObject({ deviceId: 'd1' });
  });

  it('still accepts a legacy token issued before issuer and audience existed', () => {
    const legacySession = jwt.sign(payload, SECRET, { expiresIn: '7d' });
    const legacyDevice = jwt.sign({ ...payload, deviceId: 'd1' }, SECRET);

    expect(verifyToken(legacySession)).toMatchObject({ id: 'u1' });
    expect(verifyToken(legacyDevice)).toMatchObject({ deviceId: 'd1' });
  });

  it('refuses a token for the wrong audience or issuer', () => {
    const portalTokenClaimingADevice = jwt.sign({ ...payload, deviceId: 'd1' }, SECRET, {
      issuer: 'exyconn-portal',
      audience: 'portal',
    });
    const foreignIssuer = jwt.sign(payload, SECRET, { issuer: 'someone-else', audience: 'portal' });

    expect(verifyToken(portalTokenClaimingADevice)).toBeNull();
    expect(verifyToken(foreignIssuer)).toBeNull();
  });

  it('refuses an unsigned token and one signed with another algorithm', () => {
    const unsigned = jwt.sign(payload, '', { algorithm: 'none' });
    const hs512 = jwt.sign(payload, SECRET, { algorithm: 'HS512' });

    expect(verifyToken(unsigned)).toBeNull();
    expect(verifyToken(hs512)).toBeNull();
    expect(verifyToken('not-a-token')).toBeNull();
  });
});
