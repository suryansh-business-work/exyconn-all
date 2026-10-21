import { RuleTester } from 'eslint';
import { describe, expect, it } from 'vitest';
import { exyconnA11y } from '../../../eslint.config.mjs';

// Each RuleTester case runs inline, inside the vitest case below that owns it: a failing case
// throws, so `not.toThrow()` is the assertion.
RuleTester.describe = (_text: string, run: () => void) => run();
RuleTester.it = (_text: string, run: () => void) => run();

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

const PRESSABLE = "import { Pressable } from 'react-native';\n";
const IMAGE = "import { Image } from 'expo-image';\n";
const ICONS = "import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';\n";

/** The phone's own accessibility guards: a pressable says what it is, an image what it shows. */
describe('the phone a11y lint rules', () => {
  it('pressable-has-role asks every pressable for a role', () => {
    expect(() =>
      tester.run('pressable-has-role', exyconnA11y.rules['pressable-has-role'], {
        valid: [
          `${PRESSABLE}<Pressable onPress={go} accessibilityRole="button" />`,
          `${PRESSABLE}<Pressable onLongPress={go} role="button" />`,
          `${PRESSABLE}<Pressable onPress={go} {...props} />`,
          "import { Animated } from 'react-native';\n<Animated.View />",
          // The app's own components set the role inside, where this rule checks it.
          '<AppButton label="Save" onPress={go} />',
        ],
        invalid: [
          {
            code: `${PRESSABLE}<Pressable onPress={go} />`,
            errors: [{ messageId: 'missingRole' }],
          },
          {
            code: "import { XStack } from 'tamagui';\n<XStack onLongPress={go} />",
            errors: [{ messageId: 'missingRole' }],
          },
        ],
      }),
    ).not.toThrow();
  });

  it('image-has-label asks every image and icon for a label', () => {
    expect(() =>
      tester.run('image-has-label', exyconnA11y.rules['image-has-label'], {
        valid: [
          `${IMAGE}<Image source={logo} accessibilityLabel="Exyconn" />`,
          `${IMAGE}<Image source={art} accessible={false} />`,
          `${ICONS}<MaterialCommunityIcons name="check" accessibilityLabel={label} />`,
          '<Icon name="check" />',
        ],
        invalid: [
          { code: `${IMAGE}<Image source={art} />`, errors: [{ messageId: 'missingLabel' }] },
          {
            code: `${IMAGE}<Image source={art} accessible />`,
            errors: [{ messageId: 'missingLabel' }],
          },
          {
            code: `${ICONS}<MaterialCommunityIcons name="check" />`,
            errors: [{ messageId: 'missingLabel' }],
          },
        ],
      }),
    ).not.toThrow();
  });
});
