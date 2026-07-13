import React from 'react';
import {
  Paper, Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, Tooltip,
} from '@mui/material';
import { ContentCopy, CheckCircle, Download } from '@mui/icons-material';

interface ResultDisplayProps {
  title: string;
  icon?: React.ReactNode;
  data: Record<string, unknown> | null;
  children?: React.ReactNode;
}

const DomainResultDisplay: React.FC<ResultDisplayProps> = ({ title, icon, data, children }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (data) {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (data) {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.toLowerCase().replace(/\s+/g, '-')}-result.json`;
      a.click();
    }
  };

  if (!data) return null;

  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {icon}
          <Typography variant="subtitle2" fontWeight={600}>{title}</Typography>
        </Box>
        <Box>
          <Tooltip title={copied ? 'Copied!' : 'Copy JSON'}>
            <IconButton size="small" onClick={handleCopy}>
              {copied ? <CheckCircle color="success" fontSize="small" /> : <ContentCopy fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Download JSON">
            <IconButton size="small" onClick={handleDownload}>
              <Download fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <Box sx={{ p: 2 }}>
        {children}
      </Box>
    </Paper>
  );
};

export { DomainResultDisplay };

interface KeyValueTableProps {
  data: Record<string, unknown>;
  excludeKeys?: string[];
}

export const KeyValueTable: React.FC<KeyValueTableProps> = ({ data, excludeKeys = [] }) => (
  <TableContainer>
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell sx={{ fontWeight: 600 }}>Property</TableCell>
          <TableCell sx={{ fontWeight: 600 }}>Value</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {Object.entries(data)
          .filter(([key]) => !excludeKeys.includes(key))
          .map(([key, value]) => (
            <TableRow key={key}>
              <TableCell sx={{ fontWeight: 500, textTransform: 'capitalize' }}>
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </TableCell>
              <TableCell>
                {typeof value === 'boolean' ? (
                  <Chip label={value ? 'Yes' : 'No'} size="small" color={value ? 'success' : 'error'} />
                ) : typeof value === 'object' ? (
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                    {JSON.stringify(value, null, 2)}
                  </Typography>
                ) : (
                  String(value)
                )}
              </TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  </TableContainer>
);

export default DomainResultDisplay;
