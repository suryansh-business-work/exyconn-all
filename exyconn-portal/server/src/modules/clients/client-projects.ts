import { ProjectModel } from '../projects/projects.model';
import { ClientModel } from './clients.model';
import { notFound } from '../../utils/errors';

/** Every project a client can be linked to, with the client it is linked to now (if any). */
export async function clientProjectOptions() {
  const projects = await ProjectModel.find()
    .select('name key clientId clientName status')
    .sort({ name: 1 })
    .limit(1000)
    .lean();
  return projects.map((project) => ({
    id: String(project._id),
    name: project.name,
    key: project.key ?? '',
    clientId: project.clientId ?? '',
    clientName: project.clientName ?? '',
  }));
}

/**
 * Makes `projectIds` exactly the projects linked to the client: those listed are linked to it
 * (moving them off any other client), those it had and no longer lists are unlinked.
 */
export async function setClientProjects(clientId: string, projectIds: readonly string[]) {
  const client = await ClientModel.findById(clientId).select('name').lean();
  if (!client) {
    notFound('Client');
  }
  await ProjectModel.updateMany(
    { _id: { $in: projectIds } },
    { clientId, clientName: client.name },
  );
  await ProjectModel.updateMany(
    { clientId, _id: { $nin: projectIds } },
    { clientId: null, clientName: '' },
  );
  return true;
}
