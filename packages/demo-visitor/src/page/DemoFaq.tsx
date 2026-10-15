import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useT, type Interpolations } from '@exyconn/i18n';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Typography,
} from '@exyconn/shell/components/ui';

/** One question a prospect asks before trying, or buying, the demo. */
export interface DemoQuestion {
  question: string;
  answer: string;
}

interface DemoFaqProps {
  items: readonly DemoQuestion[];
  /** Fills `{placeholders}` in the answers with facts from the live demo, e.g. its language. */
  values?: Interpolations;
}

/** The questions people ask about a demo, each opening to its answer. */
export function DemoFaq({ items, values }: Readonly<DemoFaqProps>) {
  const t = useT();
  return (
    <Box sx={{ maxWidth: 860 }}>
      {items.map((item) => (
        <Accordion key={item.question} disableGutters variant="outlined">
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography component="h3" variant="subtitle1" sx={{ fontWeight: 'fontWeightMedium' }}>
              {t(item.question)}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography color="text.secondary">{t(item.answer, values)}</Typography>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}
