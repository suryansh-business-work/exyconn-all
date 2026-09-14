import { useT } from '@exyconn/i18n';
import {
  Box,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  iconSize,
} from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import ComputerIcon from '@mui/icons-material/Computer';
import type { PlatformConfig, RequirementRow } from './download.config';

/** Minimum vs recommended device for the tracker, with the OS row for this platform. */
export function SystemRequirements({ platform }: Readonly<{ platform: PlatformConfig }>) {
  const t = useT();
  const osRow: RequirementRow = {
    key: 'os',
    label: 'Operating system',
    icon: ComputerIcon,
    minimum: platform.minOs,
    recommended: platform.recommendedOs,
  };
  const rows = [osRow, ...platform.hardware];

  return (
    <Box sx={[panel, { height: '100%' }]}>
      <Stack
        direction="row"
        sx={{
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1,
        }}
      >
        <Typography variant="subtitle1">{t('System requirements')}</Typography>
        <Chip size="small" variant="outlined" label={platform.label} />
      </Stack>
      {/* Scrolls itself on a narrow screen rather than widening the page. */}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('What')}</TableCell>
              <TableCell>{t('Minimum')}</TableCell>
              <TableCell>{t('Recommended')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              const Icon = row.icon;
              return (
                <TableRow key={row.key}>
                  <TableCell>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{
                        alignItems: 'center',
                      }}
                    >
                      <Icon sx={{ fontSize: iconSize.md, color: 'text.secondary' }} />
                      <Typography variant="body2">{t(row.label)}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                      }}
                    >
                      {t(row.minimum)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{t(row.recommended)}</Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
