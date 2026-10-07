import { vi } from 'vitest';
import { Dimensions } from './apis';

/**
 * What the tests load for `react-native` (and for Tamagui's `react-native-web` imports): the
 * primitives as plain DOM elements and the imperative APIs as spies. vitest.config aliases both
 * names here. Fire native events with `rnTest` from './apis'; override a single export with
 * `vi.mock('react-native', async (load) => ({ ...(await load()), Platform: { ... } }))`.
 */
export { View, Text, KeyboardAvoidingView } from './host';
export {
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
  TextInput,
  ScrollView,
  Modal,
} from './controls';
export { FlatList } from './lists';
export { Animated, Easing } from './animated';
export {
  AccessibilityInfo,
  AppRegistry,
  AppState,
  Dimensions,
  I18nManager,
  InteractionManager,
  Keyboard,
  Linking,
  NativeModules,
  PanResponder,
  PermissionsAndroid,
  PixelRatio,
  Platform,
  StyleSheet,
} from './apis';

export const useWindowDimensions = () => Dimensions.get('window');

/** The OS colour scheme; `vi.mocked(useColorScheme).mockReturnValue('dark')` flips it. */
export const useColorScheme = vi.fn((): 'light' | 'dark' | null => 'light');

export const findNodeHandle = (node: unknown) => node;

export const processColor = (color: unknown) => color;
