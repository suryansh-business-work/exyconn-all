import React, { useState } from 'react';
import { Box, Paper, Typography, List, Collapse, Button, Divider, Alert } from '@mui/material';
import { FileDownload } from '@mui/icons-material';
import { Business } from '../../types';
import BusinessListItem from './BusinessListItem';
import BusinessDetails from './BusinessDetails';

interface BusinessListProps {
  businesses: Business[];
  selectedBusiness: Business | null;
  onBusinessSelect: (business: Business | null) => void;
  isLoading: boolean;
}

const BusinessList: React.FC<BusinessListProps> = ({ businesses, selectedBusiness, onBusinessSelect, isLoading }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Address', 'Phone', 'Website', 'Rating', 'Reviews', 'Types'];
    const rows = businesses.map((b) => [
      b.name,
      b.address,
      b.phone || '',
      b.website || '',
      b.rating?.toString() || '',
      b.totalRatings?.toString() || '',
      b.types.join('; '),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (isLoading) {
    return (
      <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 2 }}>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Searching for businesses...
        </Typography>
      </Paper>
    );
  }

  if (businesses.length === 0) {
    return (
      <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 2 }}>
        <Alert severity="info">
          No businesses found. Draw a polygon on the map and search to find businesses in that area.
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 2,
          py: 1.5,
          bgcolor: 'grey.50',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="subtitle2" fontWeight={600}>
          Found Businesses ({businesses.length})
        </Typography>
        <Button size="small" startIcon={<FileDownload />} onClick={handleExportCSV} variant="outlined">
          Export CSV
        </Button>
      </Box>

      <List sx={{ maxHeight: 400, overflow: 'auto', p: 0 }}>
        {businesses.map((business, index) => (
          <React.Fragment key={business.placeId}>
            <BusinessListItem
              business={business}
              isSelected={selectedBusiness?.placeId === business.placeId}
              isExpanded={expandedId === business.placeId}
              onSelect={() => onBusinessSelect(business)}
              onToggleExpand={() => toggleExpanded(business.placeId)}
            />
            <Collapse in={expandedId === business.placeId} timeout="auto" unmountOnExit>
              <BusinessDetails business={business} copiedField={copiedField} onCopy={handleCopy} />
            </Collapse>
            {index < businesses.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

export default BusinessList;
