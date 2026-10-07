import { infraService } from '../../../../src/modules/infra/infra.service';
import { docker } from '../../../../src/modules/infra/docker.client';

afterEach(() => {
  jest.restoreAllMocks();
});

describe('docker storage', () => {
  it('lists images and totals what the engine disk is spent on', async () => {
    jest.spyOn(docker, 'images').mockResolvedValue([
      {
        Id: 'sha256:a',
        RepoTags: ['exyconn/api:9f2c1ab'],
        Created: 1_756_000_000,
        Size: 300,
        Containers: 1,
      },
      { Id: 'sha256:b', RepoTags: null, Created: 1_756_000_100, Size: 50, Containers: 0 },
    ]);
    jest.spyOn(docker, 'diskUsage').mockResolvedValue({
      LayersSize: 1_000,
      Containers: [{ SizeRw: 10 }, {}],
      Volumes: [{ UsageData: { Size: 200 } }, { UsageData: {} }, {}],
      BuildCache: [{ Size: 70 }, {}],
    });

    const storage = await infraService.storage();

    expect(storage.images).toEqual([
      {
        id: 'sha256:a',
        repoTags: ['exyconn/api:9f2c1ab'],
        sizeBytes: 300,
        createdAt: new Date(1_756_000_000_000),
        containers: 1,
      },
      // A dangling image has no tags; the engine says null, the screen wants a list.
      {
        id: 'sha256:b',
        repoTags: [],
        sizeBytes: 50,
        createdAt: new Date(1_756_000_100_000),
        containers: 0,
      },
    ]);
    expect(storage.usage).toEqual({
      layersBytes: 1_000,
      containersBytes: 10,
      volumesBytes: 200,
      buildCacheBytes: 70,
    });
  });

  it('counts zero for every category the engine leaves out', async () => {
    jest.spyOn(docker, 'images').mockResolvedValue([]);
    jest.spyOn(docker, 'diskUsage').mockResolvedValue({ LayersSize: 0 });

    const storage = await infraService.storage();

    expect(storage).toEqual({
      images: [],
      usage: { layersBytes: 0, containersBytes: 0, volumesBytes: 0, buildCacheBytes: 0 },
    });
  });
});
