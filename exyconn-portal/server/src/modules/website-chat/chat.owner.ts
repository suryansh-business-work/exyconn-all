import { platformOperatorOrganizationId } from '../../lib/platformAccess';
import { runForOrganization } from '../../lib/tenant';
import { badRequest } from '../../utils/errors';

/**
 * The website chat belongs to the company that runs the website — the platform operator —
 * like the WhatsApp demo's visitors. Visitors and the socket have no company of their own, so
 * every piece of chat work runs inside the operator's scope.
 */
export async function chatOwnerId(): Promise<string> {
  const id = await platformOperatorOrganizationId();
  if (id === null) {
    badRequest('The chat is not available yet.');
  }
  return id;
}

/** Runs `work` inside the chat owner's company. */
export async function asChatOwner<T>(work: () => Promise<T>): Promise<T> {
  return runForOrganization(await chatOwnerId(), work);
}
