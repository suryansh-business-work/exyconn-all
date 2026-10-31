import { execFile, spawn, type ChildProcess } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);
export const SCREEN = { width: 1280, height: 720 };

/** One trip's own screen and speaker: an X display and a PulseAudio sink nobody else uses. */
export interface Stage {
  display: string;
  sink: string;
  close(): Promise<void>;
}

const waitFor = (ms: number) => new Promise((resolve) => globalThis.setTimeout(resolve, ms));

/**
 * Starts a virtual display (Xvfb) and a null audio sink for slot `slot`. Chrome draws into the
 * display and plays the call into the sink; ffmpeg records both.
 */
export async function openStage(slot: number): Promise<Stage> {
  const display = `:${99 + slot}`;
  const sink = `meetbot_${slot}`;
  const xvfb: ChildProcess = spawn(
    'Xvfb',
    [display, '-screen', '0', `${SCREEN.width}x${SCREEN.height}x24`, '-nolisten', 'tcp'],
    { stdio: 'ignore' },
  );
  await waitFor(500);
  const { stdout } = await run('pactl', [
    'load-module',
    'module-null-sink',
    `sink_name=${sink}`,
    `sink_properties=device.description=${sink}`,
  ]);
  const moduleId = stdout.trim();
  return {
    display,
    sink,
    async close() {
      xvfb.kill('SIGTERM');
      await run('pactl', ['unload-module', moduleId]).catch(() => undefined);
    },
  };
}
