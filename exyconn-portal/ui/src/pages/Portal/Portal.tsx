import { useNavigate } from 'react-router-dom';
import { Box, CardActionArea, Grid, Flex, Heading, Text } from '@/components/ui';
import { useAuth } from '../../auth/AuthContext';
import { accessibleModules } from '../../config/modules';
import { glass } from '../../components/glass/glass';

/** Post-login landing: a grid of the modules the current role can open. */
export function Portal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const modules = accessibleModules(user.roles);

  return (
    <Box>
      <Flex direction="column" spacing={0.5} sx={{ mb: 4 }}>
        <Heading level={4}>Hello, {user.name.split(' ')[0]} 👋</Heading>
        <Text color="text.secondary">
          You have access to {modules.length} {modules.length === 1 ? 'module' : 'modules'}.
        </Text>
      </Flex>

      <Grid container spacing={3}>
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <Grid key={module.key} item xs={12} sm={6} md={4} lg={3}>
              <Box sx={[glass, { height: '100%', overflow: 'hidden' }]}>
                <CardActionArea
                  onClick={() => navigate(module.path)}
                  sx={{ p: 3, height: '100%', display: 'block' }}
                >
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: 2,
                      display: 'grid',
                      placeItems: 'center',
                      color: '#fff',
                      bgcolor: module.accent,
                      mb: 2,
                    }}
                  >
                    <Icon />
                  </Box>
                  <Heading level={6}>{module.label}</Heading>
                  <Text size="sm" color="text.secondary">
                    {module.description}
                  </Text>
                </CardActionArea>
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
