import { useState } from 'react';
import StarIcon from '@mui/icons-material/Star';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useT } from '@exyconn/i18n';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Collapse,
  Flex,
  Link,
  Text,
} from '@exyconn/shell/components/ui';
import type { ClutchCompanyFieldsFragment } from '@exyconn/shell/graphql/generated';
import { ClutchCompanyExtras } from './ClutchCompanyExtras';

interface ClutchCompanyCardProps {
  company: ClutchCompanyFieldsFragment;
  selected: boolean;
  filed: boolean;
  onToggle: (key: string) => void;
}

/** One fact under the name, shown only when Clutch gave it. */
function Fact({ label, value }: Readonly<{ label: string; value: string }>) {
  const t = useT();
  if (!value) {
    return null;
  }
  return (
    <Text size="sm" color="text.secondary">
      {t(label)}:{' '}
      <Box component="span" sx={{ color: 'text.primary' }}>
        {value}
      </Box>
    </Text>
  );
}

/** One Clutch company, formatted: who, how good, where, what it costs, and the details. */
export function ClutchCompanyCard({
  company,
  selected,
  filed,
  onToggle,
}: Readonly<ClutchCompanyCardProps>) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const extras = company.reviews.length + company.portfolio.length + company.people.length;
  const reviewsLabel =
    company.reviewCount == null ? '' : t('{count} reviews', { count: company.reviewCount });

  return (
    <Card variant="outlined">
      <CardContent>
        <Flex direction="row" spacing={2} alignItems="flex-start">
          <Checkbox
            checked={selected}
            disabled={filed}
            onChange={() => onToggle(company.key)}
            slotProps={{ input: { 'aria-label': t('Choose {name}', { name: company.name }) } }}
          />
          <Avatar src={company.logoUrl || undefined} alt="" variant="rounded">
            {company.name.charAt(0)}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Flex direction="row" spacing={1} alignItems="center" wrap>
              <Text weight="semibold">{company.name}</Text>
              {company.rating != null && (
                <Chip
                  size="small"
                  icon={<StarIcon fontSize="small" />}
                  label={`${company.rating.toFixed(1)} · ${reviewsLabel}`}
                />
              )}
              {company.verification && (
                <Chip size="small" variant="outlined" label={company.verification} />
              )}
              {filed && <Chip size="small" color="success" label={t('In the CRM')} />}
            </Flex>
            {company.tagline && <Text size="sm">{company.tagline}</Text>}
            <Fact label="Headquarters" value={company.headquarters} />
            <Fact label="Hourly rate" value={company.hourlyRate} />
            <Fact label="Min. project" value={company.minProjectSize} />
            <Fact label="Employees" value={company.employees} />
            <Fact label="Founded" value={company.founded} />
            <Fact label="Phone" value={company.phone} />
            <Fact label="Email" value={company.emails.join(', ')} />
            {company.services.length > 0 && (
              <Flex direction="row" spacing={0.5} wrap sx={{ mt: 1 }}>
                {company.services.slice(0, 8).map((service) => (
                  <Chip key={service} size="small" label={service} />
                ))}
              </Flex>
            )}
            {company.description && (
              <Text size="sm" sx={{ mt: 1 }}>
                {company.description}
              </Text>
            )}
            <Flex direction="row" spacing={2} wrap sx={{ mt: 1 }}>
              {company.profileUrl && (
                <Link href={company.profileUrl} target="_blank" rel="noopener noreferrer">
                  {t('Clutch profile')}{' '}
                  <OpenInNewIcon sx={{ fontSize: 14, verticalAlign: 'middle' }} />
                </Link>
              )}
              {company.website && (
                <Link href={company.website} target="_blank" rel="noopener noreferrer">
                  {t('Website')} <OpenInNewIcon sx={{ fontSize: 14, verticalAlign: 'middle' }} />
                </Link>
              )}
              {extras > 0 && (
                <Button
                  size="small"
                  onClick={() => setOpen((value) => !value)}
                  aria-expanded={open}
                >
                  {open
                    ? t('Hide reviews and portfolio')
                    : t('Reviews, portfolio and people ({count})', { count: extras })}
                </Button>
              )}
            </Flex>
            <Collapse in={open} unmountOnExit>
              <ClutchCompanyExtras company={company} />
            </Collapse>
          </Box>
        </Flex>
      </CardContent>
    </Card>
  );
}
