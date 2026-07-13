import React, { useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  TextField,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from '@mui/material';
import { Link as LinkIcon, Search, Download, ContentCopy, OpenInNew, FilterList } from '@mui/icons-material';
import { ExtractedUrl } from './types';

type FilterType = 'all' | 'internal' | 'external' | 'resource';

interface UrlResultsTableProps {
  urls: ExtractedUrl[];
  onCopyAll: (urls: ExtractedUrl[]) => void;
  onExportCSV: (urls: ExtractedUrl[]) => void;
}

const UrlResultsTable: React.FC<UrlResultsTableProps> = ({ urls, onCopyAll, onExportCSV }) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const filteredUrls = urls.filter((u) => {
    if (filter === 'internal' && u.type !== 'internal') return false;
    if (filter === 'external' && u.type !== 'external') return false;
    if (filter === 'resource' && !u.isResource) return false;
    if (searchTerm && !u.url.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const paginatedUrls = filteredUrls.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (urls.length === 0) {
    return (
      <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, height: '100%' }}>
        <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
          <LinkIcon sx={{ fontSize: 48, mb: 2, opacity: 0.3 }} />
          <Typography variant="body1">Enter a website URL and click Extract to find all URLs</Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, height: '100%' }}>
      <Box
        sx={{
          p: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          flexWrap: 'wrap',
        }}
      >
        <FilterList fontSize="small" color="action" />
        <Stack direction="row" spacing={0.5}>
          {(['all', 'internal', 'external', 'resource'] as const).map((f) => (
            <Chip
              key={f}
              label={f.charAt(0).toUpperCase() + f.slice(1)}
              size="small"
              variant={filter === f ? 'filled' : 'outlined'}
              color={filter === f ? 'primary' : 'default'}
              onClick={() => {
                setFilter(f);
                setPage(0);
              }}
            />
          ))}
        </Stack>
        <TextField
          size="small"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(0);
          }}
          sx={{ ml: 'auto', width: 180 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <Tooltip title="Copy All">
          <IconButton size="small" onClick={() => onCopyAll(filteredUrls)}>
            <ContentCopy fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Export CSV">
          <IconButton size="small" onClick={() => onExportCSV(filteredUrls)}>
            <Download fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      <TableContainer sx={{ maxHeight: 360 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>URL</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 100 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 50 }}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedUrls.map((u, i) => (
              <TableRow key={i} hover>
                <TableCell>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 400 }}>
                    {u.url}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {u.text}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={u.type}
                    size="small"
                    color={u.type === 'internal' ? 'success' : 'warning'}
                    sx={{ fontSize: 10 }}
                  />
                </TableCell>
                <TableCell>
                  <IconButton size="small" href={u.url} target="_blank">
                    <OpenInNew fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={filteredUrls.length}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[10, 25, 50, 100]}
      />
    </Paper>
  );
};

export default UrlResultsTable;
