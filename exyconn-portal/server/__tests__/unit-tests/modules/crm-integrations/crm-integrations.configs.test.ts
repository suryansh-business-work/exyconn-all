import {
  callConfigs,
  smsConfigs,
} from '../../../../src/modules/crm-integrations/crm-integrations.configs';
import {
  CrmCallConfigModel,
  CrmSmsConfigModel,
} from '../../../../src/modules/crm-integrations/crm-integrations.models';
import { AUTH_TOKEN, msg91Input, twilioInput, vobizInput } from './fixtures';

const MISSING_ID = '64b7f0c2a1b2c3d4e5f60718';

describe('provider config store', () => {
  it('stores a new config with its token sealed and shows only the hint', async () => {
    const shown = await callConfigs.create(twilioInput(), 'Asha');

    expect(shown).not.toHaveProperty('authToken');
    expect(shown).toMatchObject({
      label: 'Main line',
      hasAuthToken: true,
      authTokenHint: AUTH_TOKEN.slice(-4),
      updatedByName: 'Asha',
      isActive: true,
    });
    const stored = await CrmCallConfigModel.findById(shown.id).lean();
    expect(stored?.authToken).not.toBe(AUTH_TOKEN);
    expect((await callConfigs.usable(shown.id)).authToken).toBe(AUTH_TOKEN);
  });

  it('refuses a new config without a token', async () => {
    await expect(callConfigs.create(twilioInput({ authToken: '' }), 'Asha')).rejects.toThrow(
      'Enter the auth token.',
    );
    expect(await CrmCallConfigModel.countDocuments()).toBe(0);
  });

  it('switches the others off when a config is created active, and leaves them when not', async () => {
    const first = await callConfigs.create(twilioInput(), 'Asha');
    await callConfigs.create(vobizInput({ isActive: false }), 'Asha');
    expect((await callConfigs.active())?.id).toBe(first.id);

    const third = await callConfigs.create(vobizInput({ label: 'New' }), 'Asha');
    expect((await callConfigs.active())?.id).toBe(third.id);
    expect(await CrmCallConfigModel.countDocuments({ isActive: true })).toBe(1);
  });

  it('lists newest first', async () => {
    await callConfigs.create(twilioInput({ label: 'Older' }), 'Asha');
    await new Promise((resolve) => setTimeout(resolve, 5));
    await callConfigs.create(twilioInput({ label: 'Newer' }), 'Asha');

    expect((await callConfigs.list()).map((row) => row.label)).toEqual(['Newer', 'Older']);
  });

  it('keeps the stored token when an edit leaves it blank', async () => {
    const created = await callConfigs.create(twilioInput(), 'Asha');

    const updated = await callConfigs.update(
      created.id,
      twilioInput({ label: 'Renamed', authToken: '', isActive: false }),
      'Ravi',
    );

    expect(updated).toMatchObject({ label: 'Renamed', updatedByName: 'Ravi', isActive: false });
    expect((await callConfigs.usable(created.id)).authToken).toBe(AUTH_TOKEN);
  });

  it('replaces the token and switches the others off on an active edit', async () => {
    const one = await callConfigs.create(twilioInput(), 'Asha');
    const two = await callConfigs.create(vobizInput({ isActive: false }), 'Asha');

    await callConfigs.update(two.id, vobizInput({ authToken: 'another-token-0002' }), 'Ravi');

    expect((await callConfigs.usable(two.id)).authToken).toBe('another-token-0002');
    expect((await callConfigs.usable(one.id)).isActive).toBe(false);
    expect((await callConfigs.active())?.id).toBe(two.id);
  });

  it('says a missing config is not found on edit, removal and use', async () => {
    await expect(callConfigs.update(MISSING_ID, twilioInput(), 'Ravi')).rejects.toThrow(
      'Call integration not found',
    );
    await expect(smsConfigs.remove(MISSING_ID)).rejects.toThrow('SMS integration not found');
    await expect(smsConfigs.usable(MISSING_ID)).rejects.toThrow('SMS integration not found');
  });

  it('removes a config and returns what it was', async () => {
    const created = await smsConfigs.create(msg91Input(), 'Asha');

    expect((await smsConfigs.remove(created.id)).label).toBe('MSG91 texts');
    expect(await CrmSmsConfigModel.countDocuments()).toBe(0);
  });

  it('has no active config while none is switched on', async () => {
    expect(await smsConfigs.active()).toBeNull();
    await smsConfigs.create(msg91Input({ isActive: false }), 'Asha');
    expect(await smsConfigs.active()).toBeNull();
  });

  it('shows a row stored without a token or a hint as having neither', async () => {
    await CrmSmsConfigModel.collection.insertOne({
      label: 'Imported',
      provider: 'MSG91',
      authToken: '',
      isActive: false,
      createdAt: new Date(),
    });

    const [row] = await smsConfigs.list();
    expect(row).toMatchObject({ label: 'Imported', hasAuthToken: false, authTokenHint: null });
  });
});
