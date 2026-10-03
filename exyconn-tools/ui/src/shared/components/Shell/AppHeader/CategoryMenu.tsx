import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { toolsData } from '../../../data/toolsData';
import { categoryPath } from '../../../seo/site';

/** "Categories" dropdown of the desktop nav; every entry is a real link. */
const CategoryMenu: React.FC = () => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const close = () => setAnchor(null);

  return (
    <>
      <Button
        color="inherit"
        endIcon={<ExpandMore />}
        aria-haspopup="menu"
        aria-expanded={anchor ? 'true' : undefined}
        aria-controls={anchor ? 'category-menu' : undefined}
        onClick={(event) => setAnchor(event.currentTarget)}
        sx={{ minHeight: 44, px: 1.5 }}
      >
        Categories
      </Button>
      <Menu id="category-menu" anchorEl={anchor} open={Boolean(anchor)} onClose={close}>
        {toolsData.map((category) => (
          <MenuItem
            key={category.slug}
            component={RouterLink}
            to={categoryPath(category.slug)}
            onClick={close}
            sx={{ gap: 1.5, minHeight: 44 }}
          >
            <Box component={category.icon} aria-hidden sx={{ width: 16, height: 16, color: category.color }} />
            {category.category}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default CategoryMenu;
