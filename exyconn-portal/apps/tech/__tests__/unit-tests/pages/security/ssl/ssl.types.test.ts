import { describe, expect, it } from 'vitest';
import { SslCertificateStatus } from '@exyconn/shell/graphql/generated';
import {
  SSL_STATUS_COLOR,
  SSL_STATUS_LABEL,
  countStatus,
} from '../../../../../src/pages/security/ssl/ssl.types';
import { CERTIFICATES } from './ssl.fixtures';

describe('ssl.types', () => {
  it('counts the rows carrying any of the given verdicts', () => {
    expect(countStatus(CERTIFICATES, SslCertificateStatus.Ok)).toBe(1);
    expect(
      countStatus(CERTIFICATES, SslCertificateStatus.Expired, SslCertificateStatus.Invalid),
    ).toBe(2);
  });

  it('counts nothing when no verdict is asked for or no row matches', () => {
    expect(countStatus(CERTIFICATES)).toBe(0);
    expect(countStatus([], SslCertificateStatus.Ok)).toBe(0);
  });

  it('gives every verdict a colour and words', () => {
    for (const status of Object.values(SslCertificateStatus)) {
      expect(SSL_STATUS_COLOR[status]).toBeTruthy();
      expect(SSL_STATUS_LABEL[status]).toBeTruthy();
    }
    expect(SSL_STATUS_COLOR[SslCertificateStatus.Unreachable]).toBe('default');
    expect(SSL_STATUS_LABEL[SslCertificateStatus.Expiring]).toBe('Expiring soon');
  });
});
