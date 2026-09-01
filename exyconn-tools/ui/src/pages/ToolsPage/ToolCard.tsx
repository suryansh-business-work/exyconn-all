import React from 'react';
import { Card, CardActionArea, CardContent, Box, Typography } from '@mui/material';
import { ToolCardProps } from './types';

const ToolCard: React.FC<Readonly<ToolCardProps>> = ({ tool, onToolClick }) => (
  <Card elevation={0} sx={{
    height: '100%', border: 1, borderColor: 'divider',
    transition: 'border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
    '&:hover': {
      borderColor: tool.color,
      transform: 'translateY(-2px)',
      boxShadow: `0 4px 20px ${tool.color}20`,
    },
  }}>
    <CardActionArea onClick={() => onToolClick(tool)}
      sx={{ height: '100%', display: 'flex', alignItems: 'stretch' }}>
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: 1.5, bgcolor: tool.color, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Box component={tool.icon} sx={{ width: 22, height: 22, color: '#fff' }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{
              fontWeight: 600, fontSize: '0.8rem', mb: 0.25,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {tool.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              overflow: 'hidden', lineHeight: 1.45, fontSize: '0.75rem',
            }}>
              {tool.description}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </CardActionArea>
  </Card>
);

export default ToolCard;
