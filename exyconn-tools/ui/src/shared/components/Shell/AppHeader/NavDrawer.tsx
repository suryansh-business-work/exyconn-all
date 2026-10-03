import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Apps from '@mui/icons-material/Apps';
import { toolsData } from '../../../data/toolsData';
import { HUB_PATH, categoryPath } from '../../../seo/site';
import StageLabel from '../StageLabel';

interface NavDrawerProps {
  open: boolean;
  onClose: () => void;
}

/** Phone navigation: every category as a full-width, 48px link. */
const NavDrawer: React.FC<Readonly<NavDrawerProps>> = ({ open, onClose }) => (
  <Drawer anchor="right" open={open} onClose={onClose} slotProps={{ paper: { sx: { width: 'min(320px, 86vw)' } } }}>
    <Box component="nav" aria-label="Tool categories" sx={{ p: 2 }}>
      <StageLabel tick>Browse</StageLabel>
      <List sx={{ mt: 1 }}>
        <ListItemButton
          component={RouterLink}
          to={HUB_PATH}
          onClick={onClose}
          sx={{ minHeight: 48, borderRadius: '10px' }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <Apps fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="All tools" />
        </ListItemButton>
        {toolsData.map((category) => (
          <ListItemButton
            key={category.slug}
            component={RouterLink}
            to={categoryPath(category.slug)}
            onClick={onClose}
            sx={{ minHeight: 48, borderRadius: '10px' }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Box component={category.icon} aria-hidden sx={{ width: 18, height: 18, color: category.color }} />
            </ListItemIcon>
            <ListItemText primary={category.category} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  </Drawer>
);

export default NavDrawer;
