import React, { useEffect, useState } from 'react';
import { Fab, Zoom, Tooltip } from '@mui/material';
import { KeyboardArrowUp } from '@mui/icons-material';

const SHOW_AFTER_PX = 400;

/** Floating "back to top" button, shown once the page is scrolled a screenful or so. */
const ScrollTopButton: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(globalThis.scrollY > SHOW_AFTER_PX);
    onScroll();
    globalThis.addEventListener('scroll', onScroll, { passive: true });
    return () => globalThis.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <Zoom in={visible}>
      <Tooltip title="Back to top">
        <Fab
          size="small"
          color="primary"
          aria-label="Back to top"
          onClick={() => globalThis.scrollTo({ top: 0, behavior: 'smooth' })}
          sx={{
            position: 'fixed',
            bottom: { xs: 16, sm: 24 },
            right: { xs: 16, sm: 24 },
            zIndex: (theme) => theme.zIndex.speedDial,
          }}
        >
          <KeyboardArrowUp />
        </Fab>
      </Tooltip>
    </Zoom>
  );
};

export default ScrollTopButton;
