import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
} from '@mui/material';
import { Error as ErrorIcon, Warning, ExpandMore } from '@mui/icons-material';
import { ValidationIssue, ValidationResult } from './types';

interface IssuesPanelProps {
  result: ValidationResult;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

const IssueTable: React.FC<{ issues: ValidationIssue[]; max: number }> = ({ issues, max }) => (
  <>
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>Issue</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>URL</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {issues.slice(0, max).map((issue, i) => (
            <TableRow key={i}>
              <TableCell>{issue.message}</TableCell>
              <TableCell sx={{ maxWidth: 200 }}>
                <Typography variant="caption" noWrap>
                  {issue.url || '-'}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
    {issues.length > max && (
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        Showing {max} of {issues.length} issues
      </Typography>
    )}
  </>
);

const IssuesPanel: React.FC<IssuesPanelProps> = ({ result, errors, warnings }) => (
  <Box sx={{ p: 2 }}>
    {errors.length > 0 && (
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ErrorIcon color="error" fontSize="small" />
            <Typography fontWeight={600}>Errors ({errors.length})</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <IssueTable issues={errors} max={20} />
        </AccordionDetails>
      </Accordion>
    )}

    {warnings.length > 0 && (
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Warning color="warning" fontSize="small" />
            <Typography fontWeight={600}>Warnings ({warnings.length})</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <IssueTable issues={warnings} max={20} />
        </AccordionDetails>
      </Accordion>
    )}

    {result.isValid && result.issues.length === 0 && (
      <Alert severity="success" sx={{ mt: 2 }}>
        Your sitemap is valid and follows all SEO best practices!
      </Alert>
    )}
  </Box>
);

export default IssuesPanel;
