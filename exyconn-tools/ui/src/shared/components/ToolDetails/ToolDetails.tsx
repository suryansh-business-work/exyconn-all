import React from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { findToolById, getCategoryOfTool } from '../../data/toolsData';
import { getToolDetails } from '../../data/toolDetails';
import { gutterSx, SHELL_MAX_WIDTH } from '../Shell/styles';
import { ToolGrid } from '../ToolCard';
import DetailsHeading from './DetailsHeading';
import FeatureList from './FeatureList';
import HowToSteps from './HowToSteps';
import FaqList from './FaqList';

interface ToolDetailsProps {
  toolId: string;
}

const RELATED_COUNT = 4;

/**
 * Details rendered below every tool: about, features, how-to, use cases, FAQs and related
 * tools. The content comes from the toolDetails registry, which also feeds the page meta.
 */
const ToolDetails: React.FC<Readonly<ToolDetailsProps>> = ({ toolId }) => {
  const tool = findToolById(toolId);
  const category = getCategoryOfTool(toolId);
  const details = getToolDetails(toolId);
  if (!tool || !details) {
    return null;
  }
  const related = (category?.items ?? []).filter((item) => item.id !== toolId).slice(0, RELATED_COUNT);

  return (
    <Box
      component="section"
      aria-labelledby="tool-about"
      sx={{ borderTop: 1, borderColor: 'divider', bgcolor: 'background.default' }}
    >
      <Box
        sx={{
          maxWidth: SHELL_MAX_WIDTH,
          mx: 'auto',
          py: { xs: 6, md: 9 },
          display: 'grid',
          gap: { xs: 6, md: 8 },
          ...gutterSx,
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gap: { xs: 4, md: 8 },
            gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1.4fr) minmax(0, 1fr)' },
          }}
        >
          <Box>
            <DetailsHeading kicker="About" id="tool-about">
              About {tool.name}
            </DetailsHeading>
            <Box sx={{ display: 'grid', gap: 1.5 }}>
              {details.longDescription.map((paragraph) => (
                <Typography key={paragraph} sx={{ color: 'text.secondary' }}>
                  {paragraph}
                </Typography>
              ))}
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 3 }}>
              {details.useCases.map((useCase) => (
                <Chip
                  key={useCase}
                  label={useCase}
                  variant="outlined"
                  sx={{
                    height: 'auto',
                    minHeight: 32,
                    maxWidth: '100%',
                    '& .MuiChip-label': { whiteSpace: 'normal', py: 0.75 },
                  }}
                />
              ))}
            </Box>
          </Box>
          <Box>
            <DetailsHeading kicker="Steps">How to use</DetailsHeading>
            <HowToSteps steps={details.howTo} />
          </Box>
        </Box>
        <Box>
          <DetailsHeading kicker="Features">Key features</DetailsHeading>
          <FeatureList features={details.features} color={tool.color} />
        </Box>
        <Box>
          <DetailsHeading kicker="FAQ">Frequently asked questions</DetailsHeading>
          <FaqList faqs={details.faqs} />
        </Box>
        {related.length > 0 && (
          <Box>
            <DetailsHeading kicker="Related">More {category?.category ?? 'tools'}</DetailsHeading>
            <ToolGrid tools={related} headingComponent="h3" />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ToolDetails;
