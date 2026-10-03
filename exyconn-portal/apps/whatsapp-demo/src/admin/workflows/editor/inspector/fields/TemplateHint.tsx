import { useT } from '@exyconn/i18n';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Text,
} from '@exyconn/shell/components/ui';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

/** Each line is an English source; the examples inside braces are literal syntax. */
const LINES: readonly { id: string; label: string; example: string }[] = [
  { id: 'var', label: 'A variable set earlier in the chat', example: '{{orderNo}}' },
  {
    id: 'user',
    label: 'The signed-in person (also fullName, email, phone)',
    example: '{{user.firstName}}',
  },
  { id: 'money', label: 'Formats rupees', example: '{{fee|money}}' },
  {
    id: 'dates',
    label: 'Formats a time, a day or a date',
    example: '{{slot|time}} {{day|day}} {{dob|date}}',
  },
  { id: 'case', label: 'Changes the letter case', example: '{{code|upper}} {{x|lower}}' },
  { id: 'id', label: 'A reference number, the same on every reload', example: '$id:AP' },
  { id: 'price', label: 'A price, optionally varied by a percentage', example: '$price:650:15' },
  {
    id: 'pick',
    label: 'A whole number in a range, or one of several values',
    example: '$int:1:9 $pick:a|b|c',
  },
  { id: 'time', label: 'Midnight a number of days ahead, or now', example: '$days:2 $now' },
];

/**
 * The template language in plain words, collapsed by default: what `{{…}}` fills in, the
 * filters, and the `$` helpers a "set variable" value may use (wa-flow README, "Variables
 * and templates").
 */
export function TemplateHint() {
  const t = useT();
  return (
    <Accordion disableGutters variant="outlined">
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Text size="sm" weight="medium">
          {t('Personalise with variables')}
        </Text>
      </AccordionSummary>
      <AccordionDetails>
        <Text size="caption" color="text.secondary" component="p" sx={{ mb: 1 }}>
          {t(
            'Any message can fill in values while the chat runs. Write text in English; it is translated before the values go in.',
          )}
        </Text>
        <Box component="dl" sx={{ m: 0, display: 'grid', gap: 0.75 }}>
          {LINES.map((line) => (
            <Box key={line.id}>
              <Text component="dt" size="caption">
                <code>{line.example}</code>
              </Text>
              <Text component="dd" size="caption" color="text.secondary" sx={{ m: 0 }}>
                {t(line.label)}
              </Text>
            </Box>
          ))}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}
