import { useEffect, useRef } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import StarIcon from '@mui/icons-material/Star';
import { useT } from '@exyconn/i18n';
import { HTTP_URL } from '@exyconn/regex';
import {
  Checkbox,
  Chip,
  Flex,
  Link,
  ListItem,
  ListItemButton,
  Stack,
  Text,
} from '@exyconn/shell/components/ui';
import { LeadEmailChip } from './LeadEmailChip';
import { emailsOf } from './useLeadEmails';
import type { EmailLookup, LeadPlace } from './leadTypes';

interface LeadRowProps {
  place: LeadPlace;
  /** The marker number on the map. */
  number: number;
  checked: boolean;
  focused: boolean;
  lookup: EmailLookup | undefined;
  onToggle: (placeId: string) => void;
  onFocus: (placeId: string) => void;
}

/** One business: tick it to act on it, click it to find it on the map. */
export function LeadRow({
  place,
  number,
  checked,
  focused,
  lookup,
  onToggle,
  onFocus,
}: Readonly<LeadRowProps>) {
  const t = useT();
  const ref = useRef<HTMLLIElement>(null);
  useEffect(() => {
    if (focused) {
      ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [focused]);
  const emails = emailsOf(lookup);
  const website = HTTP_URL.test(place.website) ? place.website : '';
  const rating =
    place.rating == null
      ? ''
      : t('{rating} ({count} reviews)', {
          rating: place.rating,
          count: place.ratingCount ?? 0,
        });
  return (
    <ListItem ref={ref} disablePadding divider sx={{ alignItems: 'flex-start' }}>
      <Checkbox
        checked={checked}
        onChange={() => onToggle(place.placeId)}
        slotProps={{ input: { 'aria-label': t('Select {name}', { name: place.name }) } }}
        sx={{ mt: 1 }}
      />
      <Stack spacing={0.5} sx={{ minWidth: 0, width: '100%', py: 1, pr: 1 }}>
        <ListItemButton
          selected={focused}
          onClick={() => onFocus(place.placeId)}
          sx={{ borderRadius: 1, px: 1, display: 'block' }}
        >
          <Text weight="bold">{`${number}. ${place.name}`}</Text>
          <Text size="caption" color="text.secondary" sx={{ display: 'block' }}>
            {place.primaryType ? `${place.primaryType} · ${place.address}` : place.address}
          </Text>
        </ListItemButton>
        <Flex
          direction="row"
          spacing={1.5}
          flexWrap="wrap"
          useFlexGap
          alignItems="center"
          sx={{ px: 1 }}
        >
          {place.existingCompanyId && (
            <Chip
              size="small"
              color="primary"
              label={t('In CRM')}
              component={RouterLink}
              to={`/crm/companies/${place.existingCompanyId}`}
              clickable
            />
          )}
          <LeadEmailChip lookup={lookup} />
          {place.phone && <Text size="caption">{place.phone}</Text>}
          {website && (
            <Link href={website} target="_blank" rel="noopener noreferrer" variant="caption">
              {t('Website')}
            </Link>
          )}
          {rating && (
            <Flex direction="row" spacing={0.5} alignItems="center">
              <StarIcon fontSize="inherit" color="warning" aria-hidden />
              <Text size="caption">{rating}</Text>
            </Flex>
          )}
        </Flex>
        {emails.length > 0 && (
          <Text size="caption" sx={{ wordBreak: 'break-all', px: 1 }}>
            {emails.join(', ')}
          </Text>
        )}
      </Stack>
    </ListItem>
  );
}
