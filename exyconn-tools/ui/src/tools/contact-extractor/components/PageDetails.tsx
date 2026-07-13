import React, { useState } from 'react';
import { Box, Paper, Typography, Accordion, AccordionSummary, AccordionDetails, Chip, Link } from '@mui/material';
import { ExpandMore, Description, Email, Phone } from '@mui/icons-material';
import { PageResult } from '../types';

interface PageDetailsProps {
  pages: PageResult[];
}

const PageDetails: React.FC<PageDetailsProps> = ({ pages }) => {
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleChange = (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Description color="primary" />
        <Typography variant="h6" fontWeight={600}>
          Page-by-Page Results
        </Typography>
      </Box>

      {pages.map((page, idx) => {
        const hasContacts =
          page.contacts.emails.length > 0 ||
          page.contacts.phones.length > 0 ||
          Object.keys(page.contacts.socialLinks).length > 0;

        return (
          <Accordion
            key={idx}
            expanded={expanded === `panel-${idx}`}
            onChange={handleChange(`panel-${idx}`)}
            elevation={0}
            sx={{ border: 1, borderColor: 'divider', '&:before': { display: 'none' }, mb: 1 }}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', pr: 2 }}>
                <Typography
                  variant="body2"
                  fontWeight={500}
                  sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}
                >
                  {page.title || page.url}
                </Typography>
                {hasContacts && (
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {page.contacts.emails.length > 0 && (
                      <Chip
                        icon={<Email sx={{ fontSize: 14 }} />}
                        label={page.contacts.emails.length}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    )}
                    {page.contacts.phones.length > 0 && (
                      <Chip
                        icon={<Phone sx={{ fontSize: 14 }} />}
                        label={page.contacts.phones.length}
                        size="small"
                        variant="outlined"
                        color="secondary"
                      />
                    )}
                  </Box>
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Link
                href={page.url}
                target="_blank"
                rel="noopener"
                variant="caption"
                sx={{ display: 'block', mb: 2, wordBreak: 'break-all' }}
              >
                {page.url}
              </Link>

              {page.contacts.emails.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block' }}>
                    Emails:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {page.contacts.emails.map((email, i) => (
                      <Chip key={i} label={email} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}

              {page.contacts.phones.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block' }}>
                    Phones:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {page.contacts.phones.map((phone, i) => (
                      <Chip key={i} label={phone} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}

              {!hasContacts && (
                <Typography variant="body2" color="text.secondary">
                  No contacts found on this page
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Paper>
  );
};

export default PageDetails;
