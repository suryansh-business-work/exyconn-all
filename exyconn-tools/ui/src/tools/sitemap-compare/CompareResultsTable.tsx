import React, { useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tabs,
  Tab,
} from '@mui/material';
import { CompareArrows, Add, Remove, Edit } from '@mui/icons-material';
import { CompareResult } from './types';

interface CompareResultsTableProps {
  result: CompareResult | null;
}

const CompareResultsTable: React.FC<CompareResultsTableProps> = ({ result }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  if (!result) {
    return (
      <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, minHeight: 480 }}>
        <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
          <CompareArrows sx={{ fontSize: 48, mb: 2, opacity: 0.3 }} />
          <Typography variant="body1">Enter two sitemap URLs to compare</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Find added, removed, and modified URLs between versions
          </Typography>
        </Box>
      </Paper>
    );
  }

  const activeData =
    activeTab === 0 ? result.added : activeTab === 1 ? result.removed : result.modified;
  const totalCount = activeData.length;
  const paginatedData = activeData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setPage(0);
  };

  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, minHeight: 480 }}>
      <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tab
          label={`Added (${result.added.length})`}
          icon={<Add />}
          iconPosition="start"
          sx={{ minHeight: 48 }}
        />
        <Tab
          label={`Removed (${result.removed.length})`}
          icon={<Remove />}
          iconPosition="start"
          sx={{ minHeight: 48 }}
        />
        <Tab
          label={`Modified (${result.modified.length})`}
          icon={<Edit />}
          iconPosition="start"
          sx={{ minHeight: 48 }}
        />
      </Tabs>
      <TableContainer sx={{ maxHeight: 350 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>URL</TableCell>
              {activeTab === 2 && (
                <>
                  <TableCell sx={{ fontWeight: 600 }}>Old Lastmod</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>New Lastmod</TableCell>
                </>
              )}
              {activeTab !== 2 && <TableCell sx={{ fontWeight: 600 }}>Last Modified</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {activeTab === 0 &&
              paginatedData.map((u, i) => (
                <TableRow key={i} hover sx={{ bgcolor: 'success.50' }}>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 400 }}>
                      {'loc' in u ? u.loc : ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">{'lastmod' in u ? u.lastmod || '-' : '-'}</Typography>
                  </TableCell>
                </TableRow>
              ))}
            {activeTab === 1 &&
              paginatedData.map((u, i) => (
                <TableRow key={i} hover sx={{ bgcolor: 'error.50' }}>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 400 }}>
                      {'loc' in u ? u.loc : ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">{'lastmod' in u ? u.lastmod || '-' : '-'}</Typography>
                  </TableCell>
                </TableRow>
              ))}
            {activeTab === 2 &&
              paginatedData.map((u, i) => (
                <TableRow key={i} hover sx={{ bgcolor: 'warning.50' }}>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                      {'url' in u ? u.url : ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {'oldLastmod' in u ? u.oldLastmod || '-' : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {'newLastmod' in u ? u.newLastmod || '-' : '-'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={totalCount}
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

export default CompareResultsTable;
