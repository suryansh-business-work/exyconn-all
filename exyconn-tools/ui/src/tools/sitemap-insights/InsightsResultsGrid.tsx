import React from 'react';
import { Box, Typography, Chip, Stack } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { TrendingUp, Folder, CalendarToday, Speed, Language } from '@mui/icons-material';
import InsightCard from './InsightCard';
import { InsightsResult } from './types';

interface InsightsResultsGridProps {
  result: InsightsResult;
}

const InsightsResultsGrid: React.FC<InsightsResultsGridProps> = ({ result }) => (
  <Grid container spacing={2}>
    <Grid size={{ xs: 12, md: 4 }}>
      <InsightCard title="Overview" icon={<TrendingUp color="primary" />}>
        <Typography variant="h4" fontWeight={700} color="primary">
          {result.totalUrls.toLocaleString()}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Total URLs
        </Typography>
      </InsightCard>
    </Grid>

    <Grid size={{ xs: 12, md: 4 }}>
      <InsightCard title="URL Depth" icon={<Folder color="warning" />}>
        <Stack spacing={0.5}>
          {result.depthAnalysis.slice(0, 5).map((d) => (
            <Box key={d.depth} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2">Depth {d.depth}</Typography>
              <Chip label={d.count} size="small" />
            </Box>
          ))}
        </Stack>
      </InsightCard>
    </Grid>

    <Grid size={{ xs: 12, md: 4 }}>
      <InsightCard title="Content Freshness" icon={<CalendarToday color="success" />}>
        <Stack spacing={0.5}>
          {result.lastmodFreshness.map((f) => (
            <Box key={f.category} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" noWrap sx={{ maxWidth: 120 }}>
                {f.category}
              </Typography>
              <Chip label={f.count} size="small" />
            </Box>
          ))}
        </Stack>
      </InsightCard>
    </Grid>

    <Grid size={{ xs: 12, md: 6 }}>
      <InsightCard title="URL Patterns (Top 10)" icon={<TrendingUp color="info" />}>
        <Stack spacing={0.5}>
          {result.urlPatterns.slice(0, 10).map((p) => (
            <Box key={p.pattern} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                /{p.pattern}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {p.percentage}%
                </Typography>
                <Chip label={p.count} size="small" variant="outlined" />
              </Box>
            </Box>
          ))}
        </Stack>
      </InsightCard>
    </Grid>

    <Grid size={{ xs: 12, md: 3 }}>
      <InsightCard title="Change Frequency" icon={<Speed color="secondary" />}>
        <Stack spacing={0.5}>
          {result.changefreqDistribution.map((c) => (
            <Box key={c.freq} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2">{c.freq}</Typography>
              <Chip label={c.count} size="small" />
            </Box>
          ))}
          {result.changefreqDistribution.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No changefreq data
            </Typography>
          )}
        </Stack>
      </InsightCard>
    </Grid>

    <Grid size={{ xs: 12, md: 3 }}>
      <InsightCard title="Priority Distribution" icon={<TrendingUp color="error" />}>
        <Stack spacing={0.5}>
          {result.priorityDistribution.map((p) => (
            <Box key={p.range} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" noWrap sx={{ maxWidth: 100 }}>
                {p.range}
              </Typography>
              <Chip label={p.count} size="small" />
            </Box>
          ))}
          {result.priorityDistribution.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No priority data
            </Typography>
          )}
        </Stack>
      </InsightCard>
    </Grid>

    <Grid size={{ xs: 12, md: 6 }}>
      <InsightCard title="File Types" icon={<Folder color="warning" />}>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {result.fileTypes.map((f) => (
            <Chip key={f.extension} label={`${f.extension} (${f.count})`} size="small" variant="outlined" />
          ))}
        </Stack>
      </InsightCard>
    </Grid>

    <Grid size={{ xs: 12, md: 6 }}>
      <InsightCard title="Domains" icon={<Language color="primary" />}>
        <Stack spacing={0.5}>
          {result.domainBreakdown.slice(0, 5).map((d) => (
            <Box key={d.domain} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                {d.domain}
              </Typography>
              <Chip label={d.count} size="small" />
            </Box>
          ))}
        </Stack>
      </InsightCard>
    </Grid>
  </Grid>
);

export default InsightsResultsGrid;
