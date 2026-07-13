import { contextBridge, ipcRenderer } from 'electron';
import { IPC, type LoginResult, type PermissionState, type TrackerState } from '@shared/types';

/** The typed API exposed to the renderer over the context bridge (no Node access). */
const api = {
  getState: (): Promise<TrackerState> => ipcRenderer.invoke(IPC.getState),
  login: (email: string, password: string): Promise<LoginResult> =>
    ipcRenderer.invoke(IPC.login, email, password),
  logout: (): Promise<void> => ipcRenderer.invoke(IPC.logout),
  acceptConsent: (): Promise<void> => ipcRenderer.invoke(IPC.acceptConsent),
  start: (): Promise<void> => ipcRenderer.invoke(IPC.start),
  pause: (): Promise<void> => ipcRenderer.invoke(IPC.pause),
  resume: (): Promise<void> => ipcRenderer.invoke(IPC.resume),
  stop: (): Promise<void> => ipcRenderer.invoke(IPC.stop),
  getPermissions: (): Promise<PermissionState> => ipcRenderer.invoke(IPC.getPermissions),
  requestPermission: (kind: 'screenRecording' | 'accessibility'): Promise<void> =>
    ipcRenderer.invoke(IPC.requestPermission, kind),
  openPrivacy: (): Promise<void> => ipcRenderer.invoke(IPC.openPrivacy),
  onStateChanged: (listener: (state: TrackerState) => void): (() => void) => {
    const handler = (_event: unknown, state: TrackerState): void => listener(state);
    ipcRenderer.on(IPC.stateChanged, handler);
    return () => ipcRenderer.removeListener(IPC.stateChanged, handler);
  },
};

export type TrackerApi = typeof api;

contextBridge.exposeInMainWorld('tracker', api);
