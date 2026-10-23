import { MaSettingsModel } from '../../../../src/modules/meeting-assistant/models';
import { getMaSettings } from '../../../../src/modules/meeting-assistant/settings.service';

/** What findOneAndUpdate(...).lean() resolves to, or rejects with. */
const leanQuery = (outcome: Promise<unknown>) =>
  ({ lean: () => outcome }) as unknown as ReturnType<typeof MaSettingsModel.findOneAndUpdate>;

afterEach(() => jest.restoreAllMocks());

describe('getMaSettings when two first reads race', () => {
  it('reads the row the other request created when its own insert hits the unique index', async () => {
    await MaSettingsModel.create({ key: 'global', updatedByName: 'The other tab' });
    jest
      .spyOn(MaSettingsModel, 'findOne')
      .mockReturnValueOnce(leanQuery(Promise.resolve(null)) as never);
    jest
      .spyOn(MaSettingsModel, 'findOneAndUpdate')
      .mockReturnValueOnce(
        leanQuery(Promise.reject(Object.assign(new Error('E11000'), { code: 11000 }))),
      );

    const settings = await getMaSettings();

    expect(settings.updatedByName).toBe('The other tab');
  });

  it('lets any other failure through', async () => {
    jest
      .spyOn(MaSettingsModel, 'findOne')
      .mockReturnValueOnce(leanQuery(Promise.resolve(null)) as never);
    jest
      .spyOn(MaSettingsModel, 'findOneAndUpdate')
      .mockReturnValueOnce(leanQuery(Promise.reject(new Error('database went away'))));

    await expect(getMaSettings()).rejects.toThrow('database went away');
  });
});
