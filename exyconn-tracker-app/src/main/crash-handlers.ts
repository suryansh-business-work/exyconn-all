import { app, ipcMain } from 'electron';
import { captureConsole, type LogBatch } from '@exyconn/logger';
import { IPC } from '@shared/types';
import { forwardRendererLogs, logger } from './logger';

/**
 * Sends everything that goes wrong in the desktop app to Tech > Logs: uncaught errors and
 * unhandled rejections in the main process, every `console.error`/`warn`, a renderer or GPU
 * process that dies, and — over IPC — every error the two renderer windows catch.
 *
 * Handling `uncaughtException` replaces Electron's "A JavaScript error occurred" dialog; the
 * error is still printed to stderr and the app keeps running, as it did behind the dialog.
 */
export function installMainCrashHandlers(): void {
  captureConsole(logger);
  logger.setRoute('main-process');

  process.on('uncaughtException', (error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    logger.capture(error, { context: { kind: 'uncaughtException' } });
  });
  process.on('unhandledRejection', (reason) => {
    logger.capture(reason, { context: { kind: 'unhandledRejection' } });
  });
  app.on('render-process-gone', (_event, contents, details) => {
    logger.error(`Renderer process gone: ${details.reason}`, undefined, {
      exitCode: details.exitCode,
      url: contents.getURL(),
    });
  });
  app.on('child-process-gone', (_event, details) => {
    logger.error(`${details.type} process gone: ${details.reason}`, undefined, {
      exitCode: details.exitCode,
      name: details.name ?? '',
    });
  });
  ipcMain.handle(IPC.reportLogs, (_event, batch: LogBatch) => forwardRendererLogs(batch));
  logger.info('App started', { version: app.getVersion() });
}
