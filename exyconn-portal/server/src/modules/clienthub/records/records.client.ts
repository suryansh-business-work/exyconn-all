import { isValidObjectId } from 'mongoose';
import { notFound } from '../../../utils/errors';
import type { GraphQLContext } from '../../../middleware/auth';
import { ClientModel } from '../../clients/clients.model';
import { UserModel } from '../../admin/user.model';

/** The client a staff write is about, in the caller's company — or not found. */
export async function clientOrThrow(clientId: string) {
  const client = isValidObjectId(clientId)
    ? await ClientModel.findById(clientId).select('name company email').lean()
    : null;
  if (!client) {
    notFound('Client');
  }
  return client;
}

/** How a client is addressed in an email: the company when there is one, else the name. */
export const clientLabel = (client: { name: string; company?: string | null }) =>
  client.company || client.name;

/** The signed-in staff member's name, for "added by" lines the client reads. */
export async function staffName(ctx: GraphQLContext): Promise<string> {
  const id = ctx.user?.id ?? '';
  const user = isValidObjectId(id) ? await UserModel.findById(id).select('name').lean() : null;
  return user?.name ?? ctx.user?.email ?? '';
}
