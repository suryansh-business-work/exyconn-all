import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Drawer, Box, Typography, Button, Chip, Avatar, IconButton,
  Divider, List, ListItem, ListItemIcon, ListItemText,
} from '@mui/material';
import { Close, OpenInNew, CheckCircle, RocketLaunch, Info, Security } from '@mui/icons-material';
import { ToolItem } from '../../shared/data/toolsData';

interface ToolDescriptionDrawerProps {
  open: boolean;
  onClose: () => void;
  tool: ToolItem | null;
}

const ToolDescriptionDrawer: React.FC<ToolDescriptionDrawerProps> = ({ open, onClose, tool }) => {
  const navigate = useNavigate();
  if (!tool) return null;

  return (
    <Drawer anchor="right" open={open} onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 420 }, display: 'flex', flexDirection: 'column' } }}>
      {/* Header */}
      <Box sx={{ px: 2.5, py: 2, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ width: 40, height: 40, bgcolor: `${tool.color}12`, color: tool.color, borderRadius: 1 }}>
              <tool.icon sx={{ fontSize: 22 }} />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} fontSize={15}>{tool.name}</Typography>
              <Chip size="small"
                icon={tool.isActive ? <CheckCircle sx={{ fontSize: '12px !important' }} /> : <RocketLaunch sx={{ fontSize: '12px !important' }} />}
                label={tool.isActive ? 'Available' : 'Coming Soon'}
                color={tool.isActive ? 'success' : 'default'} variant="outlined"
                sx={{ height: 20, fontSize: '0.65rem', mt: 0.25 }} />
            </Box>
          </Box>
          <IconButton size="small" onClick={onClose}><Close fontSize="small" /></IconButton>
        </Box>
      </Box>

      {/* Scrollable Content */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, py: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.8 }}>
          {tool.description}
        </Typography>

        {tool.pricing && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} /> Included Features
            </Typography>
            <List dense disablePadding>
              {tool.pricing.features.map((feature, idx) => (
                <ListItem key={idx} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    <CheckCircle sx={{ fontSize: 14, color: 'success.main' }} />
                  </ListItemIcon>
                  <ListItemText primary={feature} primaryTypographyProps={{ fontSize: '0.8rem', color: 'text.secondary' }} />
                </ListItem>
              ))}
            </List>

            <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="subtitle2" fontWeight={700} fontSize={13} sx={{ mb: 0.5 }}>
                Own this tool — ${tool.pricing.price} {tool.pricing.currency}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Get the complete source code and deploy on your own infrastructure.
              </Typography>
            </Box>
          </>
        )}

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
          <Info sx={{ fontSize: 16, color: 'info.main' }} />
          <Typography variant="subtitle2" fontWeight={700} fontSize={13}>About this Tool</Typography>
        </Box>

        <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
            <Security sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">Privacy first</Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6 }}>
            Your data stays in your browser and is never sent to our servers
            unless the tool explicitly requires server processing. No sign-up required.
          </Typography>
        </Box>
      </Box>

      {/* Footer actions */}
      <Box sx={{ px: 2.5, py: 2, borderTop: 1, borderColor: 'divider', flexShrink: 0 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small" onClick={onClose} sx={{ flex: 1, textTransform: 'none' }}>
            Close
          </Button>
          {tool.isActive && (
            <Button variant="contained" size="small" endIcon={<OpenInNew sx={{ fontSize: '16px !important' }} />}
              onClick={() => { onClose(); navigate(tool.url); }}
              sx={{ flex: 1, textTransform: 'none', bgcolor: tool.color, '&:hover': { bgcolor: tool.color, filter: 'brightness(0.9)' } }}>
              Open Tool
            </Button>
          )}
        </Box>
      </Box>
    </Drawer>
  );
};

export default ToolDescriptionDrawer;
