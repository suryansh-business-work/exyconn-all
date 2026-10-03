import React from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ExpandMore from '@mui/icons-material/ExpandMore';
import type { ToolFaq } from '../../data/toolDetails';
import { radii } from '../../theme/tokens';

/** The tool's FAQs — the same questions its FAQPage JSON-LD carries. */
const FaqList: React.FC<Readonly<{ faqs: readonly ToolFaq[] }>> = ({ faqs }) => (
  <Box sx={{ display: 'grid', gap: 1 }}>
    {faqs.map((faq) => (
      <Accordion
        key={faq.question}
        disableGutters
        elevation={0}
        sx={{
          border: 1,
          borderColor: 'divider',
          borderRadius: `${radii.control} !important`,
          bgcolor: 'background.paper',
        }}
      >
        <AccordionSummary expandIcon={<ExpandMore />} sx={{ minHeight: 52 }}>
          <Typography component="h3" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
            {faq.question}
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {faq.answer}
          </Typography>
        </AccordionDetails>
      </Accordion>
    ))}
  </Box>
);

export default FaqList;
