import React from 'react';
import {
  Paper,
  Box,
  Typography,
  TextField,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
} from '@mui/material';
import { Link, Search, Download, ContentCopy, OpenInNew, FilterList } from '@mui/icons-material';
import { SitemapUrl } from './types';

interface UrlResultsTableProps {
  hasResult: boolean;
  filteredUrls: SitemapUrl[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onCopyAll: () => void;
  onExportCSV: () => void;
}

const UrlResultsTable: React.FC<UrlResultsTableProps> = ({
  hasResult,
  filteredUrls,
  searchTerm,
  onSearchChange,
  onCopyAll,
  onExportCSV,
}) => (
  <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, minHeight: 480 }}>
    {!hasResult ? (
      <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
        <Link sx={{ fontSize: 48, mb: 2, opacity: 0.3 }} />
        <Typography variant="body1">Enter a sitemap URL to extract all URLs</Typography>
      </Box>
    ) : (
      <>
        <Box
          sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <FilterList fontSize="small" color="action" />
          <TextField
            size="small"
            placeholder="Filter URLs..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            sx={{ flex: 1, maxWidth: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <Box sx={{ ml: 'auto' }}>
            <Tooltip title="Copy All URLs">
              <IconButton size="small" onClick={onCopyAll}>
                <ContentCopy fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export CSV">
              <IconButton size="small" onClick={onExportCSV}>
                <Download fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        <TableContainer sx={{ maxHeight: 420 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>URL</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 100 }}>Last Modified</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 80 }}>Freq</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 60 }}>Priority</TableCell>
                <TableCell sx={{ width: 40 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUrls.slice(0, 200).map((u, i) => (
                <TableRow key={i} hover>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 350 }}>
                      {u.loc}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">{u.lastmod || '-'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">{u.changefreq || '-'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">{u.priority ?? '-'}</Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" href={u.loc} target="_blank">
                      <OpenInNew fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {filteredUrls.length > 200 && (
          <Box sx={{ p: 1, textAlign: 'center', borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary">
              Showing 200 of {filteredUrls.length} URLs
            </Typography>
          </Box>
        )}
      </>
    )}
  </Paper>
);

export default UrlResultsTable;
