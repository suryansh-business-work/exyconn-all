import { ROLES } from '../../constants/roles';
import { logger } from '../../utils/logger';
import { UserModel } from '../admin/user.model';

/**
 * The Agents console took over screens that Tech (the bots) and Website (the chat and its leads)
 * used to hold. Everyone who could reach them before keeps reaching them: people holding TECH or
 * WEBSITE gain AGENTS. Run once per company through the migration ledger, so an administrator
 * who later takes AGENTS away is not overruled on the next boot.
 */
export async function grantAgentsRole(): Promise<void> {
  const result = await UserModel.updateMany(
    { roles: { $in: [ROLES.TECH, ROLES.WEBSITE], $ne: ROLES.AGENTS } },
    { $addToSet: { roles: ROLES.AGENTS } },
  );
  logger.info({ granted: result.modifiedCount }, 'Granted AGENTS to Tech and Website staff');
}
