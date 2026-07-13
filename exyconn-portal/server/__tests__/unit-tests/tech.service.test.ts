import { techService } from '../../src/modules/tech/tech.service';
import { EmailConfigModel } from '../../src/modules/tech/email-config.model';
import { ImageConfigModel } from '../../src/modules/tech/image-config.model';

const emailInput = {
  label: 'Primary',
  host: 'smtp.example.com',
  port: 587,
  secure: false,
  username: 'user@example.com',
  password: 'secret',
  fromAddress: 'Portal <no-reply@example.com>',
};

const imageInput = {
  label: 'Primary',
  provider: 'imagekit',
  publicKey: 'pub',
  privateKey: 'priv',
  urlEndpoint: 'https://ik.imagekit.io/demo',
};

describe('TechService', () => {
  it('keeps a single active email config', async () => {
    const first = await techService.createEmailConfig({ ...emailInput, isActive: true });
    const second = await techService.createEmailConfig({
      ...emailInput,
      label: 'Backup',
      isActive: true,
    });

    const active = await EmailConfigModel.find({ isActive: true }).lean();
    expect(active).toHaveLength(1);
    expect(active[0]._id.toString()).toBe(second._id.toString());
    expect(first.label).toBe('Primary');
  });

  it('deactivates peers when an email config is updated to active', async () => {
    const a = await techService.createEmailConfig({ ...emailInput, isActive: true });
    const b = await techService.createEmailConfig({ ...emailInput, label: 'B', isActive: false });

    await techService.updateEmailConfig(String(b._id), { ...emailInput, label: 'B', isActive: true });

    const refreshedA = await EmailConfigModel.findById(a._id).lean();
    expect(refreshedA?.isActive).toBe(false);
  });

  it('keeps a single active image config', async () => {
    await techService.createImageConfig({ ...imageInput, isActive: true });
    await techService.createImageConfig({ ...imageInput, label: 'Backup', isActive: true });

    const active = await ImageConfigModel.find({ isActive: true }).lean();
    expect(active).toHaveLength(1);
    expect(active[0].label).toBe('Backup');
  });
});
