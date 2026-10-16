import { useT } from '@exyconn/i18n';
import { Box, CardActionArea, Flex, Text, Typography } from '@exyconn/shell/components/ui';
import type { ModuleDefinition } from '@exyconn/shell/config/modules';
import { glass } from '@exyconn/shell/components/glass/glass';

interface ModuleCardProps {
  module: ModuleDefinition;
  onOpen: (module: ModuleDefinition) => void;
}

/** One launcher card: the module's icon on the left, its name and what it is for beside it. */
export function ModuleCard({ module, onOpen }: Readonly<ModuleCardProps>) {
  const t = useT();
  const Icon = module.icon;
  return (
    <Box sx={[glass, { height: '100%', overflow: 'hidden' }]}>
      <CardActionArea onClick={() => onOpen(module)} sx={{ p: 2, height: '100%' }}>
        <Flex spacing={2} alignItems="center">
          <Icon aria-hidden sx={{ color: module.accent, flexShrink: 0 }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" component="h2">
              {t(module.label)}
            </Typography>
            <Text size="sm" color="text.secondary">
              {t(module.description)}
            </Text>
          </Box>
        </Flex>
      </CardActionArea>
    </Box>
  );
}
