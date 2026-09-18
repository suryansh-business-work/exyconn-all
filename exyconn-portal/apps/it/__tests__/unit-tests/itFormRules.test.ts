import { describe, it, expect } from 'vitest';
import {
  ItAccessKind,
  ItChangeStatus,
  ItCloudKind,
  ItDecision,
  ItEnvironment,
  ItIncidentStatus,
  ItPurchaseStatus,
  ItRisk,
  ItVulnStatus,
} from '@exyconn/shell/graphql/generated';
import {
  accessRequestSchema,
  toAccessRequestInput,
  toAccessRequestValues,
} from '../../src/pages/access/forms/access-request';
import {
  changeSchema,
  changeStatusOptions,
  toChangeValues,
} from '../../src/pages/changes/forms/change';
import {
  cloudResourceSchema,
  toCloudResourceValues,
} from '../../src/pages/cloud/forms/cloud-resource';
import {
  incidentSchema,
  toIncidentInput,
  toIncidentValues,
} from '../../src/pages/incidents/forms/incident';
import {
  purchaseRequestSchema,
  purchaseStatusOptions,
  toPurchaseRequestValues,
} from '../../src/pages/procurement/forms/purchase-request';
import {
  toVulnerabilityInput,
  toVulnerabilityValues,
  vulnerabilitySchema,
} from '../../src/pages/security/forms/vulnerability';
import { itSettingsSchema, toItSettingsValues } from '../../src/pages/settings/forms/it-settings';
import { decisionSchema } from '../../src/components/decision';
import { bestPrice, type PagedPurchaseRow } from '../../src/pages/procurement/procurement-grid';

/** The first error message zod reports for a value, or null when it is valid. */
function firstError(
  schema: {
    safeParse: (v: unknown) => { success: boolean; error?: { issues: Array<{ message: string }> } };
  },
  value: unknown,
) {
  const result = schema.safeParse(value);
  return result.success ? null : (result.error?.issues[0]?.message ?? 'invalid');
}

describe('access requests', () => {
  const valid = {
    ...toAccessRequestValues(null, ItAccessKind.Grant),
    employeeId: 'emp-1',
    application: 'Slack',
    reason: 'Joins the support team',
  };

  it('accepts a complete grant', () => {
    expect(firstError(accessRequestSchema, valid)).toBeNull();
  });

  it('asks which role for a role change', () => {
    expect(firstError(accessRequestSchema, { ...valid, kind: ItAccessKind.RoleChange })).toBe(
      'Say which role they should have',
    );
  });

  it('refuses an expiry in the past', () => {
    expect(
      firstError(accessRequestSchema, { ...valid, expiresAt: '2020-01-01T00:00:00.000Z' }),
    ).toBe('An expiry has to be in the future');
  });

  it('sends no level or expiry for a password reset', () => {
    const input = toAccessRequestInput({
      ...valid,
      kind: ItAccessKind.PasswordReset,
      accessLevel: 'Admin',
      expiresAt: '2099-01-01T00:00:00.000Z',
    });
    expect(input).toMatchObject({ accessLevel: '', expiresAt: null });
  });
});

describe('changes', () => {
  const valid = {
    ...toChangeValues(null),
    title: 'Upgrade Mongo',
    description: 'Minor version bump',
    system: 'Database',
    rollbackPlan: 'Restore the snapshot',
  };

  it('accepts a planned change with a rollback plan', () => {
    expect(firstError(changeSchema, valid)).toBeNull();
  });

  it('needs a rollback plan for a risky production change', () => {
    expect(firstError(changeSchema, { ...valid, rollbackPlan: '' })).toContain('rollback plan');
  });

  it('lets a low-risk change go without one', () => {
    expect(firstError(changeSchema, { ...valid, rollbackPlan: '', risk: ItRisk.Low })).toBeNull();
  });

  it('refuses a window that ends before it starts', () => {
    const start = '2026-10-01T10:00:00.000Z';
    expect(
      firstError(changeSchema, {
        ...valid,
        plannedStart: start,
        plannedEnd: '2026-10-01T09:00:00.000Z',
      }),
    ).toBe('The window must end after it starts');
  });

  it('never offers a decision from the form, unless it already has one', () => {
    expect(changeStatusOptions(null)).not.toContain(ItChangeStatus.Approved);
    expect(changeStatusOptions(ItChangeStatus.Approved)).toContain(ItChangeStatus.Approved);
    expect(changeStatusOptions(ItChangeStatus.Approved)).not.toContain(ItChangeStatus.Rejected);
  });

  it('defaults to a production draft', () => {
    expect(toChangeValues(null)).toMatchObject({
      status: ItChangeStatus.Draft,
      environment: ItEnvironment.Production,
    });
  });
});

describe('cloud resources', () => {
  it('needs an expiry for a certificate', () => {
    const value = {
      ...toCloudResourceValues(null),
      name: 'exyconn.com',
      kind: ItCloudKind.SslCertificate,
    };
    expect(firstError(cloudResourceSchema, value)).toBe(
      'A domain or certificate needs its expiry date',
    );
  });
});

describe('incidents', () => {
  const valid = { ...toIncidentValues(null), title: 'VPN down', description: 'Nobody can connect' };

  it('needs a root cause once resolved', () => {
    expect(firstError(incidentSchema, { ...valid, status: ItIncidentStatus.Resolved })).toContain(
      'root cause',
    );
  });

  it('sends an undated follow-up as null', () => {
    const input = toIncidentInput({
      ...valid,
      followUps: [{ title: 'Renew certificate', ownerName: '', dueAt: '', done: false }],
    });
    expect(input.followUps[0].dueAt).toBeNull();
  });
});

describe('procurement', () => {
  const valid = {
    ...toPurchaseRequestValues(null),
    title: 'Laptops',
    justification: 'Two new joiners',
  };

  it('needs a quote before it is marked quoted', () => {
    expect(
      firstError(purchaseRequestSchema, { ...valid, status: ItPurchaseStatus.Quoted }),
    ).toContain('at least one quote');
  });

  it('never offers approval from the form', () => {
    expect(purchaseStatusOptions(null)).not.toContain(ItPurchaseStatus.Approved);
  });

  it('prices by the cheapest quote, or the estimate without one', () => {
    const row = { estimatedCost: 900, quotes: [] } as unknown as PagedPurchaseRow;
    expect(bestPrice(row)).toBe(900);
    expect(
      bestPrice({
        ...row,
        quotes: [{ amount: 800 }, { amount: 700 }],
      } as unknown as PagedPurchaseRow),
    ).toBe(700);
  });
});

describe('vulnerabilities', () => {
  const valid = {
    ...toVulnerabilityValues(null),
    title: 'XZ backdoor',
    affectedSystem: 'Build servers',
  };

  it('checks the CVE format and upper-cases it', () => {
    expect(firstError(vulnerabilitySchema, { ...valid, cve: 'CVE-24-1' })).toBe(
      'Use the CVE-YYYY-NNNN format',
    );
    expect(toVulnerabilityInput({ ...valid, cve: 'cve-2024-3094' }).cve).toBe('CVE-2024-3094');
  });

  it('asks why a risk is accepted', () => {
    expect(firstError(vulnerabilitySchema, { ...valid, status: ItVulnStatus.Accepted })).toBe(
      'Explain why the risk is accepted',
    );
  });
});

describe('settings and decisions', () => {
  it('only lets onboarding use listed applications', () => {
    const value = {
      ...toItSettingsValues(null),
      applications: ['Email'],
      onboardingApplications: ['Zoom'],
    };
    expect(firstError(itSettingsSchema, value)).toBe('Only applications from the list above');
  });

  it('needs a reason to reject, but not to approve', () => {
    expect(firstError(decisionSchema, { decision: ItDecision.Approved, note: '' })).toBeNull();
    expect(firstError(decisionSchema, { decision: ItDecision.Rejected, note: '' })).toBe(
      'Say why it is being rejected',
    );
  });
});
