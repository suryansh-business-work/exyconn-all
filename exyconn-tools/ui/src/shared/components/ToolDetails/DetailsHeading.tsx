import React from 'react';
import Typography from '@mui/material/Typography';
import StageLabel from '../Shell/StageLabel';
import { displaySx } from '../Shell/styles';

interface DetailsHeadingProps {
  kicker: string;
  children: React.ReactNode;
  id?: string;
}

/** Mono kicker over a condensed section title. */
const DetailsHeading: React.FC<Readonly<DetailsHeadingProps>> = ({ kicker, children, id }) => (
  <>
    <StageLabel tick>{kicker}</StageLabel>
    <Typography
      id={id}
      component="h2"
      sx={{ ...displaySx, fontSize: { xs: '1.45rem', sm: '1.7rem', md: '2.1rem' }, mt: 1, mb: 2.5 }}
    >
      {children}
    </Typography>
  </>
);

export default DetailsHeading;
