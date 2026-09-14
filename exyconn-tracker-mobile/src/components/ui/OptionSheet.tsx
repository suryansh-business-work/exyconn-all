import { useMemo, useState, type RefObject } from 'react';
import { FlatList, Modal, Pressable, type HostInstance } from 'react-native';
import { SCRIM } from '../../theme/palette';
import { Input, XStack, YStack } from 'tamagui';
import { useT } from '@exyconn/i18n';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { useReturnFocus } from '../../hooks/useReturnFocus';
import { useBrand } from '../../theme/BrandProvider';
import { TRACKER_RADIUS } from '../../theme/tokens';
import { AppButton } from './AppButton';
import { Icon } from './Icon';
import { Body, Caption, Heading } from './Typography';

export interface Option {
  value: string;
  label: string;
  caption?: string;
}

interface Props {
  open: boolean;
  title: string;
  options: readonly Option[];
  selected: string;
  onSelect: (value: string) => void;
  onClose: () => void;
  /** The control that opened the sheet; the screen reader goes back to it on close. */
  returnFocusTo: RefObject<HostInstance | null>;
  /** Long lists (zones, tickets) get a filter box. */
  searchable?: boolean;
}

interface RowProps {
  option: Option;
  selected: boolean;
  onPress: () => void;
}

function OptionRow({ option, selected, onPress }: Readonly<RowProps>) {
  const brand = useBrand();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={option.label}
    >
      <XStack paddingVertical="$3" gap="$3" alignItems="center">
        <YStack flex={1} gap="$0.5">
          <Body fontWeight={selected ? '700' : '400'}>{option.label}</Body>
          {option.caption === undefined ? null : <Caption>{option.caption}</Caption>}
        </YStack>
        {selected ? <Icon name="check" color={brand.primary} /> : null}
      </XStack>
    </Pressable>
  );
}

/** Keeps only the options whose label or caption contains the query, case-insensitively. */
export function filterOptions(options: readonly Option[], query: string): Option[] {
  const needle = query.trim().toLowerCase();
  if (needle === '') {
    return [...options];
  }
  return options.filter((option) =>
    `${option.label} ${option.caption ?? ''}`.toLowerCase().includes(needle),
  );
}

/**
 * A bottom sheet of choices — the phone's stand-in for the desktop's MUI Select and
 * Autocomplete. One pattern for every picker in the app: project, ticket, presence, zone.
 */
export function OptionSheet({
  open,
  title,
  options,
  selected,
  onSelect,
  onClose,
  returnFocusTo,
  searchable = false,
}: Readonly<Props>) {
  const t = useT();
  const [query, setQuery] = useState('');
  const reduceMotion = useReduceMotion();
  const { titleRef, modalProps } = useReturnFocus(open, returnFocusTo);
  const visible = useMemo(() => filterOptions(options, query), [options, query]);

  function choose(value: string): void {
    setQuery('');
    onSelect(value);
    onClose();
  }

  return (
    <Modal
      visible={open}
      transparent
      animationType={reduceMotion ? 'none' : 'slide'}
      onRequestClose={onClose}
      {...modalProps}
    >
      <YStack flex={1} justifyContent="flex-end" backgroundColor={SCRIM}>
        <YStack
          backgroundColor="$paper"
          borderTopLeftRadius={TRACKER_RADIUS}
          borderTopRightRadius={TRACKER_RADIUS}
          padding="$4"
          gap="$3"
          maxHeight="80%"
          accessibilityViewIsModal
        >
          <XStack justifyContent="space-between" alignItems="center">
            <Heading ref={titleRef}>{title}</Heading>
            <AppButton label={t('Close')} tone="text" onPress={onClose} />
          </XStack>
          {searchable ? (
            <Input
              value={query}
              onChangeText={setQuery}
              placeholder={t('Search')}
              accessibilityLabel={t('Search {title}', { title })}
              autoCorrect={false}
            />
          ) : null}
          <FlatList
            data={visible}
            keyExtractor={(option) => option.value}
            renderItem={({ item }) => (
              <OptionRow
                option={item}
                selected={item.value === selected}
                onPress={() => choose(item.value)}
              />
            )}
            ListEmptyComponent={<Caption>{t('Nothing matches.')}</Caption>}
          />
        </YStack>
      </YStack>
    </Modal>
  );
}
