import { Types } from 'mongoose';
import { adminService } from '../../../../src/modules/admin/admin.service';
import { runForOrganization } from '../../../../src/lib/tenant';
import { useTestOrganization } from '../../../helpers';

useTestOrganization({ currency: 'EUR', country: 'DE', fiscalYearStartMonth: 4, taxSystem: 'NONE' });

describe('workspace settings inside a company', () => {
  it('carries the company’s money, country, financial year and tax rules', async () => {
    const settings = await adminService.getSettings();

    expect(settings).toMatchObject({
      key: 'global',
      currency: 'EUR',
      country: 'DE',
      fiscalYearStartMonth: 4,
      taxSystem: 'NONE',
    });
  });

  it('falls back to neutral values when the company record cannot be found', async () => {
    const settings = await runForOrganization(new Types.ObjectId().toHexString(), () =>
      adminService.getSettings(),
    );

    expect(settings).toMatchObject({
      currency: '',
      country: '',
      fiscalYearStartMonth: 1,
      taxSystem: 'NONE',
    });
  });
});
