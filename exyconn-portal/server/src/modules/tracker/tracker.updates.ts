import { Router } from 'express';
import { githubActions } from '../../utils/github';
import { logger } from '../../utils/logger';

/** Where the desktop app's updater looks for its feed. */
export const TRACKER_UPDATES_PATH = '/tracker-updates';

/**
 * How long one release lookup is reused. Every installed tracker polls this route, so
 * without it a fleet of desktops would spend the portal's GitHub rate limit asking the
 * same question. A new release is picked up within the minute.
 */
const CACHE_MS = 60_000;

/** Only ever a file name — never a path — so the route cannot be walked out of. */
const FILE_NAME = /^[\w.-]+$/;

let cachedFiles: Map<string, string> | null = null;
let cachedAt = 0;

async function releaseFiles(): Promise<Map<string, string>> {
  if (cachedFiles && Date.now() - cachedAt < CACHE_MS) {
    return cachedFiles;
  }
  cachedFiles = await githubActions.latestTrackerReleaseFiles();
  cachedAt = Date.now();
  return cachedFiles;
}

/** Forgets the cached release — for tests, and after a build publishes a new one. */
export function resetTrackerUpdatesCache(): void {
  cachedFiles = null;
  cachedAt = 0;
}

/**
 * The desktop tracker's update feed.
 *
 * electron-updater's generic provider wants `latest.yml` and the installers beside it at
 * one base URL. The files themselves live on the GitHub release the tracker-release
 * workflow publishes, so this redirects to them rather than proxying the bytes: the app
 * only ever has to know the portal's address, and the portal keeps the GitHub credentials.
 *
 * Deliberately unauthenticated. The updater runs before anybody signs in — and an
 * installer is public on the release page regardless.
 */
export function trackerUpdatesRouter(): Router {
  const router = Router();

  router.get('/:file', (req, res) => {
    const { file } = req.params;
    if (!FILE_NAME.test(file)) {
      res.status(400).json({ error: 'Not an update file name.' });
      return;
    }
    releaseFiles()
      .then((files) => {
        const url = files.get(file);
        if (!url) {
          res.status(404).json({ error: `No ${file} on a recent tracker release.` });
          return;
        }
        res.redirect(302, url);
      })
      .catch((error: unknown) => {
        logger.error({ err: error, file }, 'Tracker update feed unavailable');
        res.status(502).json({ error: 'The update feed is unavailable.' });
      });
  });

  return router;
}
