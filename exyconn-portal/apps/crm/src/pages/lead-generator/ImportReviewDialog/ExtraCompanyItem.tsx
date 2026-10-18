import { useT } from '@exyconn/i18n';
import { Checkbox, Flex, Stack, Text } from '@exyconn/shell/components/ui';
import type { LeadImportPreview } from '../leadTypes';
import { CompanyLink } from './CompanyLink';
import { extraText } from './extraText';

interface ExtraCompanyItemProps {
  preview: LeadImportPreview;
  checked: boolean;
  onToggle: (placeId: string) => void;
}

/** An existing company with the details the lead would add, and whether to add them. */
export function ExtraCompanyItem({ preview, checked, onToggle }: Readonly<ExtraCompanyItemProps>) {
  const t = useT();
  return (
    <Flex direction="row" alignItems="flex-start" spacing={1}>
      <Checkbox
        checked={checked}
        onChange={() => onToggle(preview.placeId)}
        slotProps={{
          input: {
            'aria-label': t('Add the extra details to {name}', {
              name: preview.existingName ?? preview.name,
            }),
          },
        }}
      />
      <Stack spacing={0.25} sx={{ minWidth: 0, pt: 1 }}>
        <CompanyLink preview={preview} />
        {preview.extras.map((extra) => (
          <Text
            key={`${extra.field}:${extra.incoming}`}
            size="caption"
            color="text.secondary"
            sx={{ overflowWrap: 'anywhere' }}
          >
            {extraText(t, extra)}
          </Text>
        ))}
      </Stack>
    </Flex>
  );
}
