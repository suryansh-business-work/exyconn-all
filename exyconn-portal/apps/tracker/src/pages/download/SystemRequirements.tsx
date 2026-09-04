import {
  Box,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@exyconn/shell/components/ui';
import { glass } from '@exyconn/shell/components/glass/glass';
import ComputerIcon from '@mui/icons-material/Computer';
import { REQUIREMENTS, type PlatformConfig, type RequirementRow } from './download.config';

/** Minimum vs recommended machine for the tracker, with the OS row for this platform. */
export function SystemRequirements({ platform }: Readonly<{ platform: PlatformConfig }>) {
  const osRow: RequirementRow = {
    key: 'os',
    label: 'Operating system',
    icon: ComputerIcon,
    minimum: platform.minOs,
    recommended: platform.recommendedOs,
  };
  const rows = [osRow, ...REQUIREMENTS];

  return (
    <Box sx={[glass, { p: 2, height: '100%' }]}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="subtitle1">System requirements</Typography>
        <Chip size="small" variant="outlined" label={platform.label} />
      </Stack>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>What</TableCell>
            <TableCell>Minimum</TableCell>
            <TableCell>Recommended</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => {
            const Icon = row.icon;
            return (
              <TableRow key={row.key}>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Icon sx={{ fontSize: 17, color: 'text.secondary' }} />
                    <Typography variant="body2">{row.label}</Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {row.minimum}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{row.recommended}</Typography>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
}
