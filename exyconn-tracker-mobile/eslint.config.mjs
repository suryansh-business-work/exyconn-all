import { portalEslintConfig } from '@exyconn/config/eslint';

/**
 * Where the app's native building blocks come from. Only elements imported from these are
 * checked: the app's own components (AppButton, RoundButton, Icon…) set the role and label
 * inside, and that inside is itself checked here.
 */
const HOST_SOURCES = [
  'react-native',
  'tamagui',
  'expo-image',
  'react-native-gesture-handler',
  '@expo/vector-icons',
];
const ICON_SOURCE = '@expo/vector-icons';
const IMAGE_NAMES = new Set(['Image', 'ImageBackground']);
const PRESS_PROPS = new Set(['onPress', 'onLongPress']);
const ROLE_PROPS = new Set(['accessibilityRole', 'role']);
const LABEL_PROPS = new Set(['accessibilityLabel', 'aria-label']);

const fromSource = (source, root) => source === root || source.startsWith(`${root}/`);

/** The local names this file imported from the host libraries, and which are icon sets. */
function collectImports() {
  const hosts = new Set();
  const icons = new Set();
  return {
    hosts,
    icons,
    ImportDeclaration(node) {
      const source = String(node.source.value);
      if (!HOST_SOURCES.some((root) => fromSource(source, root))) {
        return;
      }
      for (const specifier of node.specifiers) {
        hosts.add(specifier.local.name);
        if (fromSource(source, ICON_SOURCE)) {
          icons.add(specifier.local.name);
        }
      }
    },
  };
}

/** `Pressable` → Pressable; `Animated.View` / `Checkbox.Indicator` → their root import. */
function rootName(name) {
  let current = name;
  while (current.type === 'JSXMemberExpression') {
    current = current.object;
  }
  return current.type === 'JSXIdentifier' ? current.name : null;
}

function attributes(node) {
  const names = new Map();
  let spread = false;
  for (const attribute of node.attributes) {
    if (attribute.type === 'JSXSpreadAttribute') {
      spread = true;
    } else {
      names.set(String(attribute.name.name), attribute);
    }
  }
  return { names, spread };
}

const hasAny = (names, wanted) => [...wanted].some((name) => names.has(name));

function isFalse(attribute) {
  const value = attribute?.value;
  return value?.type === 'JSXExpressionContainer' && value.expression.value === false;
}

/**
 * The phone's own accessibility guard (WCAG 2.2 AA, 4.1.2 and 1.1.1), on top of the shared
 * react-native-a11y prop validation:
 *
 * - `pressable-has-role` — a native element with `onPress`/`onLongPress` must say what it is
 *   (`accessibilityRole` or `role`), or TalkBack and VoiceOver announce a nameless "double-tap".
 * - `image-has-label` — an `<Image>` or an @expo/vector-icons glyph must carry an
 *   `accessibilityLabel`, or be hidden with `accessible={false}` when it is decoration. Use the
 *   app's `Icon`, which hides unlabelled icons by itself.
 *
 * Elements that spread props are skipped: what they receive cannot be read here.
 */
export const exyconnA11y = {
  meta: { name: 'exyconn-a11y' },
  rules: {
    'pressable-has-role': {
      meta: {
        type: /** @type {const} */ ('problem'),
        docs: { description: 'Require an accessibility role on pressable native elements.' },
        messages: {
          missingRole:
            '<{{name}}> handles presses but has no accessibilityRole — screen readers cannot say what it is.',
        },
        schema: [],
      },
      create(context) {
        const imports = collectImports();
        return {
          ImportDeclaration: imports.ImportDeclaration,
          JSXOpeningElement(node) {
            const name = rootName(node.name);
            const { names, spread } = attributes(node);
            if (name === null || !imports.hosts.has(name) || spread) {
              return;
            }
            if (hasAny(names, PRESS_PROPS) && !hasAny(names, ROLE_PROPS)) {
              context.report({ node, messageId: 'missingRole', data: { name } });
            }
          },
        };
      },
    },
    'image-has-label': {
      meta: {
        type: /** @type {const} */ ('problem'),
        docs: { description: 'Require a label, or accessible={false}, on images and icons.' },
        messages: {
          missingLabel:
            '<{{name}}> needs an accessibilityLabel, or accessible={false} when it is decorative.',
        },
        schema: [],
      },
      create(context) {
        const imports = collectImports();
        return {
          ImportDeclaration: imports.ImportDeclaration,
          JSXOpeningElement(node) {
            const name = rootName(node.name);
            const { names, spread } = attributes(node);
            const image = imports.hosts.has(name) && IMAGE_NAMES.has(name);
            if (spread || !(image || imports.icons.has(name))) {
              return;
            }
            if (!hasAny(names, LABEL_PROPS) && !isFalse(names.get('accessible'))) {
              context.report({ node, messageId: 'missingLabel', data: { name } });
            }
          },
        };
      },
    },
  },
};

/** The workspace's shared rules; React Native adds only its `__DEV__` global. */
export default [
  ...portalEslintConfig({ platform: 'native' }),
  {
    ignores: [
      'android/**',
      'ios/**',
      '.expo/**',
      'plugins/**',
      '*.config.js',
      '*.config.mjs',
      '*.config.mts',
    ],
  },
  { languageOptions: { globals: { __DEV__: 'readonly' } } },
  {
    files: ['**/*.tsx'],
    plugins: { 'exyconn-a11y': exyconnA11y },
    rules: {
      'exyconn-a11y/pressable-has-role': 'error',
      'exyconn-a11y/image-has-label': 'error',
    },
  },
];
