import { database } from '../config/database';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { ROLES } from '../constants/roles';
import { UserModel } from '../modules/admin/user.model';
import { AppSettingsModel } from '../modules/admin/settings.model';
import { hashPassword } from '../utils/password';
import { seedEmployeeData } from './seedEmployee';
import { seedWebsiteContent } from '../modules/website/seed';
import { getBranding } from '../modules/branding';

/** Idempotently seeds the ADMIN user and global settings. */
async function seed(): Promise<void> {
  await database.connect();

  // One-time migration: convert any legacy single `role` field to a `roles` array.
  const migrated = await UserModel.collection.updateMany(
    { role: { $exists: true }, roles: { $exists: false } },
    [{ $set: { roles: ['$role'] } }, { $unset: 'role' }] as never,
  );
  if (migrated.modifiedCount) {
    logger.info(`Migrated ${migrated.modifiedCount} user(s) from role to roles`);
  }

  // One-time migration: consolidate the retired BUGS/CLIENTS roles (Bugs is now
  // covered by PROJECTS, Clients by ADMIN). $setUnion de-duplicates the result.
  const rolesMigrated = await UserModel.collection.updateMany(
    { roles: { $in: ['BUGS', 'CLIENTS'] } },
    [
      {
        $set: {
          roles: {
            $setUnion: [
              {
                $map: {
                  input: '$roles',
                  as: 'r',
                  in: {
                    $switch: {
                      branches: [
                        { case: { $eq: ['$$r', 'BUGS'] }, then: 'PROJECTS' },
                        { case: { $eq: ['$$r', 'CLIENTS'] }, then: 'ADMIN' },
                      ],
                      default: '$$r',
                    },
                  },
                },
              },
              [],
            ],
          },
        },
      },
    ] as never,
  );
  if (rolesMigrated.modifiedCount) {
    logger.info(`Consolidated roles for ${rolesMigrated.modifiedCount} user(s)`);
  }

  // Backfill required fields added after early accounts were created. Lean reads
  // skip Mongoose defaults, so a doc missing these breaks the non-null GraphQL
  // `User` type and nullifies the whole `listUsers` query.
  const backfilled = await UserModel.collection.updateMany(
    {
      $or: [
        { isActive: { $exists: false } },
        { isBlocked: { $exists: false } },
        { employmentStatus: { $exists: false } },
      ],
    },
    [
      {
        $set: {
          isActive: { $ifNull: ['$isActive', true] },
          isBlocked: { $ifNull: ['$isBlocked', false] },
          employmentStatus: { $ifNull: ['$employmentStatus', 'ACTIVE'] },
        },
      },
    ] as never,
  );
  if (backfilled.modifiedCount) {
    logger.info(`Backfilled ${backfilled.modifiedCount} user(s) with default required fields`);
  }

  const existing = await UserModel.findOne({ email: env.seedAdmin.email.toLowerCase() });
  if (!existing) {
    const passwordHash = await hashPassword(env.seedAdmin.password);
    await UserModel.create({
      name: env.seedAdmin.name,
      email: env.seedAdmin.email,
      passwordHash,
      roles: [ROLES.ADMIN],
      isActive: true,
    });
    logger.info(`Seeded ADMIN user: ${env.seedAdmin.email}`);
  } else {
    logger.info('ADMIN user already exists, skipping');
  }

  const settings = await AppSettingsModel.findOne({ key: 'global' });
  if (!settings) {
    await AppSettingsModel.create({ key: 'global' });
    logger.info('Seeded global AppSettings');
  }

  await seedEmployeeData();
  await seedWebsiteContent();

  // Materialises the global Branding document with its defaults so Admin > Branding and
  // every consumer (website, tracker, tools) has a brand to read on a fresh install.
  await getBranding();
  logger.info('Branding document ready');

  await database.disconnect();
  logger.info('Seed complete');
}

seed().catch((error) => {
  logger.error(error, 'Seed failed');
  process.exit(1);
});
