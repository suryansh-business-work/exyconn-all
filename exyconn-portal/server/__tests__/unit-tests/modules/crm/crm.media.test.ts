import { ROLES } from '../../../../src/constants/roles';
import { invalidatePermissionCache } from '../../../../src/lib/permissions';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { crmMediaResolvers, withAttachments } from '../../../../src/modules/crm/crm.media';
import { RolePermissionModel } from '../../../../src/modules/permissions/permission.model';
import { imageUploader } from '../../../../src/utils/imagekit';
import { asArg } from '../../../mockAs';
import { crmUser } from '../crm-integrations/fixtures';

afterEach(() => {
  jest.restoreAllMocks();
  invalidatePermissionCache();
});

describe('files on CRM activities', () => {
  it('stamps who attached each file from the session, not the client', async () => {
    const save = jest.fn((_p: unknown, args: never, _c: GraphQLContext) => args);
    const ctx = crmUser();

    const saved = await withAttachments(save)(
      null,
      asArg({
        id: 'a1',
        input: {
          subject: 'Site visit',
          attachments: [
            {
              url: ' https://ik.imagekit.io/x/photo.jpg ',
              name: ' photo.jpg ',
              uploadedBy: 'forged',
            },
          ],
        },
      }),
      ctx,
    );

    expect(saved).toMatchObject({
      id: 'a1',
      input: {
        subject: 'Site visit',
        attachments: [
          {
            url: 'https://ik.imagekit.io/x/photo.jpg',
            name: 'photo.jpg',
            contentType: '',
            uploadedBy: 'sales@exyconn.com',
          },
        ],
      },
    });
  });

  it('saves an activity without files with an empty list', async () => {
    const save = jest.fn((_p: unknown, args: never, _c: GraphQLContext) => args);

    const saved = await withAttachments(save)(
      null,
      asArg({ input: { subject: 'Call' } }),
      crmUser(),
    );

    expect(saved).toEqual({ input: { subject: 'Call', attachments: [] } });
  });

  it('reads activities saved before files and durations existed as empty', () => {
    const { Activity } = crmMediaResolvers;
    expect(Activity.attachments({})).toEqual([]);
    expect(Activity.attachments({ attachments: [{ url: 'u' }] })).toEqual([{ url: 'u' }]);
    expect(Activity.durationSeconds({})).toBeNull();
    expect(Activity.durationSeconds({ durationSeconds: 95 })).toBe(95);
  });

  it('uploads a file for someone who may create activities', async () => {
    const upload = jest
      .spyOn(imageUploader, 'uploadCrmMedia')
      .mockResolvedValue('https://ik.imagekit.io/x/rec.mp3');

    await expect(
      crmMediaResolvers.Mutation.uploadCrmMedia(
        null,
        { file: 'AAAA', fileName: 'rec.mp3' },
        crmUser(),
      ),
    ).resolves.toBe('https://ik.imagekit.io/x/rec.mp3');
    expect(upload).toHaveBeenCalledWith('AAAA', 'rec.mp3');
  });

  it('refuses the upload when the role may not create activities', async () => {
    await RolePermissionModel.create({ role: ROLES.CRM, module: 'Activity', actions: ['VIEW'] });
    const upload = jest.spyOn(imageUploader, 'uploadCrmMedia');

    await expect(
      crmMediaResolvers.Mutation.uploadCrmMedia(
        null,
        { file: 'AAAA', fileName: 'a.png' },
        crmUser(),
      ),
    ).rejects.toThrow('Your role may not create Activity');
    expect(upload).not.toHaveBeenCalled();
  });
});
