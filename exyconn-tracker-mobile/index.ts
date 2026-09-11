// The app entry. Beside Expo Router it registers the keep-alive headless task, which the Android
// foreground service runs for the length of a tracking session.
import 'expo-router/entry';
import { registerKeepAliveTask } from './src/tracker/keep-alive';

registerKeepAliveTask();
