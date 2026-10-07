import {
  computeCostUsd,
  costOfRun,
  ensureAiModelPrices,
  priceForModel,
} from '../../../../src/modules/ai/ai.pricing';
import { AiModelPriceModel } from '../../../../src/modules/ai/ai-price.model';
import { ensureAiModelPrices as exported } from '../../../../src/modules/ai';
import { logger } from '../../../../src/utils/logger';

afterEach(() => jest.restoreAllMocks());

describe('priceForModel', () => {
  it('returns the two numbers of an active price row', async () => {
    await AiModelPriceModel.create({
      model: 'gpt-4o',
      inputPer1kUsd: 0.0025,
      outputPer1kUsd: 0.01,
    });

    await expect(priceForModel('gpt-4o')).resolves.toEqual({
      inputPer1kUsd: 0.0025,
      outputPer1kUsd: 0.01,
    });
  });

  it('has no price for an unknown model or a switched-off row', async () => {
    await AiModelPriceModel.create({
      model: 'retired',
      inputPer1kUsd: 1,
      outputPer1kUsd: 1,
      active: false,
    });

    await expect(priceForModel('retired')).resolves.toBeNull();
    await expect(priceForModel('never-heard-of-it')).resolves.toBeNull();
  });
});

describe('costOfRun', () => {
  it('prices a run at the model’s current rate', async () => {
    await AiModelPriceModel.create({ model: 'm', inputPer1kUsd: 2, outputPer1kUsd: 4 });

    await expect(costOfRun('m', { promptTokens: 500, completionTokens: 250 })).resolves.toBe(2);
  });

  it('is zero for a model without a price', async () => {
    await expect(costOfRun('m', { promptTokens: 500, completionTokens: 250 })).resolves.toBe(0);
  });

  it('is zero for a run that used no tokens', () => {
    expect(
      computeCostUsd(
        { promptTokens: 0, completionTokens: 0 },
        { inputPer1kUsd: 9, outputPer1kUsd: 9 },
      ),
    ).toBe(0);
  });
});

describe('ensureAiModelPrices', () => {
  it('seeds every missing model once and says how many it added', async () => {
    const info = jest.spyOn(logger, 'info').mockImplementation(() => undefined);

    await ensureAiModelPrices();

    expect(await AiModelPriceModel.countDocuments({ active: true })).toBe(7);
    expect(info).toHaveBeenCalledWith('Seeded 7 AI model price(s)');
  });

  it('never overwrites a corrected price and stays quiet when nothing was missing', async () => {
    await ensureAiModelPrices();
    await AiModelPriceModel.updateOne({ model: 'gpt-4o' }, { inputPer1kUsd: 0.5, active: false });
    const info = jest.spyOn(logger, 'info').mockImplementation(() => undefined);

    await exported();

    const corrected = await AiModelPriceModel.findOne({ model: 'gpt-4o' }).lean();
    expect(corrected).toMatchObject({ inputPer1kUsd: 0.5, active: false });
    expect(await AiModelPriceModel.countDocuments()).toBe(7);
    expect(info).not.toHaveBeenCalled();
  });

  it('adds only the models that were deleted', async () => {
    await ensureAiModelPrices();
    await AiModelPriceModel.deleteOne({ model: 'o3-mini' });
    const info = jest.spyOn(logger, 'info').mockImplementation(() => undefined);

    await ensureAiModelPrices();

    expect(info).toHaveBeenCalledWith('Seeded 1 AI model price(s)');
  });
});
