// The app entry. Beside Expo Router it installs the crash handlers (Tech > Logs) before anything
// renders, and registers the keep-alive headless task, which the Android foreground service runs
// for the length of a tracking session.
import 'expo-router/entry';
import { installCrashHandlers } from './src/tracker/crash-handlers';
import { registerKeepAliveTask } from './src/tracker/keep-alive';

installCrashHandlers();
registerKeepAliveTask();
