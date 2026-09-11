import type { TrackerSettings } from '@exyconn/tracker-core';
import type { Capabilities } from '../../tracker/types';

/** One line of "What this phone records". */
export interface RecordLine {
  id: 'time' | 'input' | 'apps' | 'screenshots' | 'webcam';
  /** False lines are stated too: what is NOT recorded is half of an honest disclosure. */
  recorded: boolean;
  title: string;
  detail: string;
}

type Settings = Pick<
  TrackerSettings,
  'screenshotsPerInterval' | 'blurScreenshots' | 'webcamEnabled'
>;

function timeLine(capabilities: Capabilities): RecordLine {
  if (capabilities.background) {
    return {
      id: 'time',
      recorded: true,
      title: 'Time worked, and whether you are active or idle',
      detail:
        'The screen being off or locked counts as idle. Tracking carries on with the app closed, and a notification stays up for as long as it does.',
    };
  }
  return {
    id: 'time',
    recorded: true,
    title: 'Time worked, while the tracker is open',
    detail:
      'iPhone lets no app see anything beyond itself, so leaving the tracker counts as idle — only time with it open on screen is counted as work.',
  };
}

/** No phone lets an app count them — said plainly, so a zero is never read as a measurement. */
const INPUT_LINE: RecordLine = {
  id: 'input',
  recorded: false,
  title: 'Key presses and taps — never',
  detail: 'No phone lets an app count them, and nothing you type is ever read.',
};

function appsLine(capabilities: Capabilities): RecordLine {
  if (capabilities.foregroundApp) {
    return {
      id: 'apps',
      recorded: true,
      title: 'Which app is in front, and for how long',
      detail: 'The app’s name only — never what is on it, what you type or what you read.',
    };
  }
  return {
    id: 'apps',
    recorded: false,
    title: 'Which apps you use — not on iPhone',
    detail: 'iPhone doesn’t allow apps to see other apps.',
  };
}

function screenshotsLine(capabilities: Capabilities, settings: Settings | null): RecordLine {
  if (!capabilities.screenshots) {
    return {
      id: 'screenshots',
      recorded: false,
      title: 'Screenshots — not on iPhone',
      detail: 'iPhone doesn’t allow apps to capture the screen.',
    };
  }
  if ((settings?.screenshotsPerInterval ?? 0) === 0) {
    return {
      id: 'screenshots',
      recorded: false,
      title: 'Screenshots — switched off',
      detail: 'Your workspace does not take screenshots.',
    };
  }
  const blurred = settings?.blurScreenshots === true ? ' They are blurred before upload.' : '';
  return {
    id: 'screenshots',
    recorded: true,
    title: 'Periodic screenshots of your screen',
    detail: `Android asks you to allow screen capture each time you start, and every screenshot is announced by a notification as it is taken.${blurred}`,
  };
}

function webcamLine(capabilities: Capabilities, settings: Settings | null): RecordLine {
  if (!capabilities.webcam) {
    return {
      id: 'webcam',
      recorded: false,
      title: 'Camera photos — not on iPhone',
      detail: 'iPhone doesn’t allow apps to use the camera in the background.',
    };
  }
  if (settings?.webcamEnabled !== true) {
    return {
      id: 'webcam',
      recorded: false,
      title: 'Camera photos — switched off',
      detail: 'Your workspace has not turned on the front-camera photo.',
    };
  }
  return {
    id: 'webcam',
    recorded: true,
    title: 'A front-camera photo with each screenshot',
    detail:
      'One frame, placed in a corner of that screenshot — the camera switches straight back off.',
  };
}

/** Said under the list: stopped means stopped. */
export const NOTHING_WHEN_STOPPED =
  'Nothing is recorded while tracking is off, and you can pause or stop at any time.';

/**
 * What THIS phone records while tracking is on, derived from what it can actually observe —
 * the app's own account, beside the workspace's disclosure. An Android phone does nearly what
 * the desktop does; an iPhone records time and nothing else, and says so.
 */
export function phoneRecords(capabilities: Capabilities, settings: Settings | null): RecordLine[] {
  return [
    timeLine(capabilities),
    INPUT_LINE,
    appsLine(capabilities),
    screenshotsLine(capabilities, settings),
    webcamLine(capabilities, settings),
  ];
}

/**
 * The one thing the app states on its own account whatever the disclosure says: being
 * photographed is not something anyone should be able to leave out of it.
 */
export const PHONE_WEBCAM_DISCLOSURE =
  'Your workspace also takes a photo with this phone’s front camera at the same moment as each screenshot, and places it in a corner of that screenshot. It happens only while tracking is on, every one is announced, and you can see them all — in this app and in the portal.';

/** Shown only where it can happen: the workspace has it on, and this phone can take one. */
export function showsWebcamDisclosure(
  capabilities: Capabilities,
  settings: Settings | null,
): boolean {
  return capabilities.webcam && settings?.webcamEnabled === true;
}
