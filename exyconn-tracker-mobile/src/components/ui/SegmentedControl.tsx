import { Pressable } from 'react-native';
import { XStack } from 'tamagui';
import { useBrand } from '../../theme/BrandProvider';
import { borderWidth, radius, trackerSelected } from '../../theme/tokens';
import { Icon, type IconName } from './Icon';
import { Body } from './Typography';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: IconName;
  /** Spoken instead of the label when the label alone says too little ("Table"). */
  accessibilityLabel?: string;
}

/**
 * `tabs` switches between views of one screen (report, messages); `choice` picks a setting
 * (theme, progress style). They look the same and are announced differently.
 */
export type SegmentKind = 'tabs' | 'choice';

interface Props<T extends string> {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (next: T) => void;
  /** What the choice is about — announced for the whole group. */
  label: string;
  kind?: SegmentKind;
  /** Stretch across the row, or hug the labels (a chart's view switch). */
  full?: boolean;
}

interface SegmentProps<T extends string> {
  option: SegmentOption<T>;
  selected: boolean;
  kind: SegmentKind;
  full: boolean;
  onPress: () => void;
}

function Segment<T extends string>({
  option,
  selected,
  kind,
  full,
  onPress,
}: Readonly<SegmentProps<T>>) {
  const { scheme } = useBrand();
  const pill = trackerSelected[scheme];
  const ink = selected ? pill.ink : undefined;
  const state = kind === 'tabs' ? { selected } : { checked: selected };
  return (
    <Pressable
      onPress={onPress}
      style={full ? { flex: 1 } : undefined}
      accessibilityRole={kind === 'tabs' ? 'tab' : 'radio'}
      accessibilityLabel={option.accessibilityLabel ?? option.label}
      accessibilityState={state}
    >
      <XStack
        gap="$1.5"
        justifyContent="center"
        alignItems="center"
        paddingVertical="$2"
        paddingHorizontal="$3"
        borderRadius={radius.pill}
        backgroundColor={selected ? pill.fill : 'transparent'}
      >
        {option.icon === undefined ? null : <Icon name={option.icon} size={18} color={ink} />}
        <Body size="$3" fontWeight="600" color={ink ?? '$muted'}>
          {option.label}
        </Body>
      </XStack>
    </Pressable>
  );
}

/**
 * A row of mutually exclusive options — the MUI Tabs and ToggleButtonGroup the desktop uses,
 * drawn as one pill track. One option is always selected, and wears the inverted ink pill the
 * desktop's selected tab does.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  kind = 'tabs',
  full = false,
}: Readonly<Props<T>>) {
  return (
    <XStack
      accessibilityRole={kind === 'tabs' ? 'tablist' : 'radiogroup'}
      accessibilityLabel={label}
      borderWidth={borderWidth.hairline}
      borderColor="$hairline"
      borderRadius={radius.pill}
      backgroundColor="$paper"
      padding="$1"
      gap="$1"
      alignSelf={full ? 'stretch' : 'flex-start'}
    >
      {options.map((option) => (
        <Segment
          key={option.value}
          option={option}
          selected={option.value === value}
          kind={kind}
          full={full}
          onPress={() => onChange(option.value)}
        />
      ))}
    </XStack>
  );
}
