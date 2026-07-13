import React from 'react';
import {
  Box, Typography, Chip, Accordion, AccordionSummary, AccordionDetails,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
} from '@mui/material';
import { ExpandMore, CheckCircle, Warning, Error as ErrorIcon, Info } from '@mui/icons-material';
import { SEOResult } from './types';

interface SeoResultDisplayProps {
  result: SEOResult;
}

const SeverityIcon: React.FC<{ severity: string }> = ({ severity }) => {
  if (severity === 'critical') return <ErrorIcon sx={{ fontSize: 16, color: 'error.main' }} />;
  if (severity === 'warning') return <Warning sx={{ fontSize: 16, color: 'warning.main' }} />;
  return <Info sx={{ fontSize: 16, color: 'info.main' }} />;
};

const getScoreColor = (score: number) => {
  if (score >= 80) return 'success';
  if (score >= 50) return 'warning';
  return 'error';
};

const SeoResultDisplay: React.FC<SeoResultDisplayProps> = ({ result }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    {/* Score */}
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Box sx={{
          width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          bgcolor: `${getScoreColor(result.score)}.main`, color: 'white',
        }}>
          <Typography variant="h5" fontWeight={800}>{result.score}</Typography>
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={700}>SEO Score</Typography>
          <Typography variant="body2" color="text.secondary">{result.url}</Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Chip size="small" label={`${result.wordCount} words`} />
        <Chip size="small" label={`${result.links.total} links`} />
        <Chip size="small" label={`${result.images.total} images`} />
        {result.schemaMarkup.length > 0 && <Chip size="small" color="success" label="Schema found" />}
      </Box>
    </Paper>

    {/* Issues */}
    <Accordion defaultExpanded>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Typography variant="subtitle2" fontWeight={700}>Issues ({result.issues.length})</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Severity</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Message</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {result.issues.map((issue, idx) => (
                <TableRow key={idx}>
                  <TableCell><SeverityIcon severity={issue.severity} /></TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{issue.type}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{issue.message}</TableCell>
                </TableRow>
              ))}
              {result.issues.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} sx={{ textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      <CheckCircle color="success" sx={{ fontSize: 16 }} />
                      <Typography variant="body2">No issues found!</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </AccordionDetails>
    </Accordion>

    {/* Meta Tags */}
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Typography variant="subtitle2" fontWeight={700}>Meta Tags</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box>
            <Typography variant="caption" fontWeight={600} color="text.secondary">Title ({result.title.length}/60)</Typography>
            <Typography variant="body2">{result.title.text || 'Not found'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" fontWeight={600} color="text.secondary">Description ({result.metaDescription.length}/160)</Typography>
            <Typography variant="body2">{result.metaDescription.text || 'Not found'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" fontWeight={600} color="text.secondary">Canonical</Typography>
            <Typography variant="body2">{result.canonical || 'Not found'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" fontWeight={600} color="text.secondary">Language</Typography>
            <Typography variant="body2">{result.language || 'Not set'}</Typography>
          </Box>
        </Box>
      </AccordionDetails>
    </Accordion>

    {/* Headings */}
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Typography variant="subtitle2" fontWeight={700}>Headings</Typography>
      </AccordionSummary>
      <AccordionDetails>
        {Object.entries(result.headings).map(([tag, items]) => (
          <Box key={tag} sx={{ mb: 1 }}>
            <Chip size="small" label={`${tag.toUpperCase()} (${items.length})`} sx={{ mb: 0.5 }} />
            {items.map((text, i) => (
              <Typography key={i} variant="caption" display="block" color="text.secondary" sx={{ pl: 1 }}>
                {text}
              </Typography>
            ))}
          </Box>
        ))}
      </AccordionDetails>
    </Accordion>
  </Box>
);

export default SeoResultDisplay;
