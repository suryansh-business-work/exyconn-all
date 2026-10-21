import { githubActions } from '../../utils/github';
import type { ReleaseChannel } from './ma.enums';

/** The workflow that builds the Chrome extension and uploads it to the portal. */
export const EXTENSION_WORKFLOW_FILE = 'meet-extension-release.yml';

/** Builds are made from main, like every push the workflow builds on its own. */
const EXTENSION_BUILD_REF = 'main';

/**
 * Starts a new extension build through the GitHub config in Tech (the one Tracker Build uses);
 * the run uploads the build here, where it waits for approval.
 */
export async function startExtensionBuild(channel: ReleaseChannel): Promise<boolean> {
  await githubActions.dispatchWorkflow(EXTENSION_WORKFLOW_FILE, EXTENSION_BUILD_REF, { channel });
  return true;
}
