import React from 'react';
import {
  Card, CardContent, Box, Typography, Chip, Avatar,
  IconButton, Tooltip,
} from '@mui/material';
import { RocketLaunch, Info, OpenInNew } from '@mui/icons-material';
import { ToolCardProps } from './types';

interface ExtendedToolCardProps extends ToolCardProps {
  onShowDescription?: (tool: ToolCardProps['tool']) => void;
}

const ToolCard: React.FC<ExtendedToolCardProps> = ({ tool, onToolClick, onShowDescription }) => (
  <Card elevation={0} sx={{
    height: '100%', border: 1,
    borderColor: tool.isActive ? 'divider' : 'action.disabledBackground',
    opacity: tool.isActive ? 1 : 0.6,
    transition: 'all 0.2s ease',
    '&:hover': tool.isActive
      ? { borderColor: tool.color, transform: 'translateY(-2px)', boxShadow: `0 4px 20px ${tool.color}20` }
      : { opacity: 0.75 },
  }}>
    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, position: 'relative' }}>
      {!tool.isActive && (
        <Box sx={{ position: 'absolute', top: 6, right: 6 }}>
          <Chip icon={<RocketLaunch sx={{ fontSize: '0.65rem !important' }} />} label="Coming Soon" size="small"
            sx={{ height: 18, fontSize: '0.6rem', fontWeight: 600, bgcolor: 'grey.100', color: 'grey.600',
              '& .MuiChip-icon': { ml: 0.5 } }} />
        </Box>
      )}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
        <Avatar sx={{ width: 36, height: 36, bgcolor: `${tool.color}12`, color: tool.color, borderRadius: 1.5 }}>
          <tool.icon sx={{ fontSize: 18 }} />
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{
            mb: 0.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8rem',
          }}>
            {tool.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            overflow: 'hidden', lineHeight: 1.4, fontSize: '0.7rem',
          }}>
            {tool.description}
          </Typography>
        </Box>
      </Box>

      {/* Action buttons */}
      {tool.isActive && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mt: 1 }}>
          <Tooltip title="Show description & details" arrow placement="top">
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); onShowDescription?.(tool); }}
              sx={{
                bgcolor: 'action.hover', '&:hover': { bgcolor: `${tool.color}20`, color: tool.color },
                width: 28, height: 28,
              }}
            >
              <Info sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Jump to tool" arrow placement="top">
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); onToolClick(tool); }}
              sx={{
                bgcolor: `${tool.color}12`, color: tool.color,
                '&:hover': { bgcolor: `${tool.color}25` },
                width: 28, height: 28,
              }}
            >
              <OpenInNew sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </CardContent>
  </Card>
);

export default ToolCard;
