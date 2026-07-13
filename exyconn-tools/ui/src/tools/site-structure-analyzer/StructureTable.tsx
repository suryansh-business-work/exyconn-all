import React, { useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from '@mui/material';
import { AccountTree, ArrowDownward, ArrowUpward, OpenInNew } from '@mui/icons-material';
import { StructurePage } from './types';

interface StructureTableProps {
  pages: StructurePage[];
}

const getDepthColor = (depth: number): string => {
  const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];
  return colors[Math.min(depth, colors.length - 1)];
};

const StructureTable: React.FC<StructureTableProps> = ({ pages }) => {
  const [sortBy, setSortBy] = useState<'incoming' | 'outgoing'>('incoming');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const sortedPages = [...pages].sort((a, b) =>
    sortBy === 'incoming' ? b.incomingLinks - a.incomingLinks : b.outgoingLinks - a.outgoingLinks
  );

  const paginatedPages = sortedPages.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, minHeight: 480 }}>
      {pages.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
          <AccountTree sx={{ fontSize: 48, mb: 2, opacity: 0.3 }} />
          <Typography variant="body1">Enter a website URL to analyze its internal linking structure</Typography>
        </Box>
      ) : (
        <>
          <Box
            sx={{
              p: 1.5,
              borderBottom: 1,
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Sort by:
            </Typography>
            <Chip
              label="Incoming Links"
              size="small"
              icon={<ArrowDownward />}
              variant={sortBy === 'incoming' ? 'filled' : 'outlined'}
              color={sortBy === 'incoming' ? 'primary' : 'default'}
              onClick={() => setSortBy('incoming')}
            />
            <Chip
              label="Outgoing Links"
              size="small"
              icon={<ArrowUpward />}
              variant={sortBy === 'outgoing' ? 'filled' : 'outlined'}
              color={sortBy === 'outgoing' ? 'primary' : 'default'}
              onClick={() => setSortBy('outgoing')}
            />
          </Box>
          <TableContainer sx={{ maxHeight: 380 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Page</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 80 }}>Depth</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 100 }}>Incoming</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 100 }}>Outgoing</TableCell>
                  <TableCell sx={{ width: 40 }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedPages.map((p, i) => (
                  <TableRow key={i} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 300 }}>
                        {p.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap display="block">
                        {p.url}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={p.depth}
                        size="small"
                        sx={{ bgcolor: getDepthColor(p.depth), color: 'white', fontSize: 10 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <ArrowDownward fontSize="small" color="success" />
                        <Typography variant="body2" fontWeight={500}>
                          {p.incomingLinks}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <ArrowUpward fontSize="small" color="info" />
                        <Typography variant="body2" fontWeight={500}>
                          {p.outgoingLinks}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" href={p.url} target="_blank">
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
            count={sortedPages.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50]}
          />
        </>
      )}
    </Paper>
  );
};

export default StructureTable;
