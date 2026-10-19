import { Types } from 'mongoose';
import type { GraphQLError } from 'graphql';
import { googleMapsConfigs } from '../../../../src/modules/google-maps/google-maps-config.service';
import { GoogleMapsConfigModel } from '../../../../src/modules/google-maps/google-maps-config.model';

const KEY = process.env.TEST_GOOGLE_KEY ?? 'AIzaTestServerKey000000000000000000';
const missingId = () => new Types.ObjectId().toHexString();

const codeOf = (promise: Promise<unknown>) =>
  promise.then(
    () => 'OK',
    (error: unknown) => (error as GraphQLError).extensions?.code,
  );

const config = (fields: Record<string, unknown> = {}) =>
  GoogleMapsConfigModel.create({ label: 'Main', serverKey: KEY, ...fields }).then((row) =>
    row._id.toHexString(),
  );

afterEach(() => {
  jest.restoreAllMocks();
});

describe('googleMapsConfigs', () => {
  it('keeps one config active: a new active one turns the others off', async () => {
    const first = await config({ isActive: true });

    await googleMapsConfigs.create({
      label: 'Second',
      browserKey: '',
      serverKey: KEY,
      isActive: true,
    });
    await googleMapsConfigs.create({ label: 'Spare', browserKey: '', serverKey: KEY });

    const rows = await googleMapsConfigs.list();
    expect(Object.fromEntries(rows.map((row) => [row.label, row.isActive]))).toEqual({
      Spare: false,
      Second: true,
      Main: false,
    });
    expect(rows.find((row) => row.label === 'Main')?._id.toHexString()).toBe(first);
  });

  it('activating one on edit turns the others off; editing a missing one is not found', async () => {
    const first = await config({ isActive: true });
    const second = await config({ label: 'Second' });

    const saved = await googleMapsConfigs.update(second, {
      label: 'Second',
      browserKey: 'b-new',
      serverKey: '',
      isActive: true,
    });

    expect(saved).toMatchObject({ isActive: true, browserKey: 'b-new', serverKey: KEY });
    await expect(GoogleMapsConfigModel.findById(first).lean()).resolves.toMatchObject({
      isActive: false,
    });
    await expect(
      codeOf(
        googleMapsConfigs.update(missingId(), { label: 'x', browserKey: '', serverKey: '' }),
      ),
    ).resolves.toBe('NOT_FOUND');
  });

  it('tests a config with one Places search through its own server key', async () => {
    const id = await config();
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        Response.json({ places: [{ id: 'p1', location: { latitude: 51.5, longitude: -0.1 } }] }),
      );

    await expect(googleMapsConfigs.test(id)).resolves.toMatch(
      /^Places API answered with 1 results\./,
    );
    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get('X-Goog-Api-Key')).toBe(KEY);
  });

  it('refuses to test a missing config, or one without a server key', async () => {
    const keyless = await GoogleMapsConfigModel.collection.insertOne({
      label: 'Keyless',
      serverKey: '',
    });

    await expect(codeOf(googleMapsConfigs.test(missingId()))).resolves.toBe('NOT_FOUND');
    await expect(googleMapsConfigs.test(keyless.insertedId.toHexString())).rejects.toThrow(
      /server key is required/,
    );
  });

  it('removes a config, and says a missing one is not found', async () => {
    const id = await config();

    await expect(googleMapsConfigs.remove(id)).resolves.toBe(true);
    await expect(GoogleMapsConfigModel.countDocuments()).resolves.toBe(0);
    await expect(codeOf(googleMapsConfigs.remove(id))).resolves.toBe('NOT_FOUND');
  });

  it('tells the CRM there is no browser key and no search until a config is active', async () => {
    await expect(googleMapsConfigs.client()).resolves.toEqual({
      browserKey: null,
      placesReady: false,
    });

    await config({ isActive: true });
    await expect(googleMapsConfigs.client()).resolves.toEqual({
      browserKey: null,
      placesReady: true,
    });
  });
});
