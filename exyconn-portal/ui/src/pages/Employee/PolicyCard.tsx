import {
  Box,
  Button,
  Card,
  CardFooter,
  CardHeader,
  Chip,
  Heading,
  Paragraph,
  Text,
} from '@/components/ui';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useSettings } from '@/hooks/useSettings';

export interface Policy {
  id: string;
  title: string;
  category: 'LEAVE' | 'CONDUCT' | 'IT' | 'FINANCE' | 'GENERAL';
  summary: string;
  url?: string | null;
  effectiveDate: string;
}

/** A single company policy rendered as a branded card. */
export function PolicyCard({ policy }: { policy: Policy }) {
  const { formatDate } = useSettings();

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title={<Heading level={6}>{policy.title}</Heading>}
        subheader={<Chip size="small" label={policy.category} />}
      />
      <Box sx={{ px: 2 }}>
        <Paragraph sx={{ color: 'text.secondary' }}>{policy.summary}</Paragraph>
      </Box>
      <CardFooter sx={{ justifyContent: 'space-between' }}>
        <Text size="caption" color="text.secondary">
          {`Effective ${formatDate(policy.effectiveDate)}`}
        </Text>
        {policy.url && (
          <Button
            size="small"
            href={policy.url}
            target="_blank"
            rel="noopener"
            endIcon={<OpenInNewIcon fontSize="small" />}
          >
            Open
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
