import React from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';
import { Download } from '@mui/icons-material';
import { ExtractionResult } from '../types';

interface ExportButtonsProps {
  result: ExtractionResult;
}

const ExportButtons: React.FC<ExportButtonsProps> = ({ result }) => {
  const exportToCSV = () => {
    const rows: string[][] = [['Type', 'Value', 'Source Page']];

    result.pages.forEach((page) => {
      page.contacts.emails.forEach((email) => {
        rows.push(['Email', email, page.url]);
      });
      page.contacts.phones.forEach((phone) => {
        rows.push(['Phone', phone, page.url]);
      });
      Object.entries(page.contacts.socialLinks).forEach(([platform, url]) => {
        rows.push([`Social (${platform})`, url, page.url]);
      });
    });

    const csvContent = rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `contacts_${new URL(result.baseUrl).hostname}_${Date.now()}.csv`;
    link.click();
  };

  const exportToJSON = () => {
    const jsonContent = JSON.stringify(result, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `contacts_${new URL(result.baseUrl).hostname}_${Date.now()}.json`;
    link.click();
  };

  const totalContacts = result.totalEmails.length + result.totalPhones.length + Object.keys(result.socialLinks).length;

  if (totalContacts === 0) return null;

  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 2 }}>
        Export Contacts
      </Typography>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="outlined" startIcon={<Download />} onClick={exportToCSV} fullWidth>
          Export CSV
        </Button>
        <Button variant="outlined" startIcon={<Download />} onClick={exportToJSON} fullWidth>
          Export JSON
        </Button>
      </Box>
    </Paper>
  );
};

export default ExportButtons;
