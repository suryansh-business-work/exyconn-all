import { useT } from '@exyconn/i18n';
import { ToggleButton, ToggleButtonGroup } from '@exyconn/shell/components/ui';
import type { ColdEmailVariantFieldsFragment } from '@exyconn/shell/graphql/generated';

interface VariantSwitcherProps {
  variants: ColdEmailVariantFieldsFragment[];
  selectedId: string;
  onSelect: (variantId: string) => void;
}

/** The draft's versions as numbered segmented buttons, oldest first; one is shown at a time. */
export function VariantSwitcher({
  variants,
  selectedId,
  onSelect,
}: Readonly<VariantSwitcherProps>) {
  const t = useT();
  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={selectedId}
      onChange={(_event, next: string | null) => {
        // A toggle group can be clicked off; one version is always shown.
        if (next) {
          onSelect(next);
        }
      }}
      aria-label={t('Versions')}
      sx={{ flexWrap: 'wrap' }}
    >
      {variants.map((variant, index) => (
        <ToggleButton
          key={variant.id}
          value={variant.id}
          aria-label={t('Version {number}', { number: index + 1 })}
        >
          {index + 1}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
