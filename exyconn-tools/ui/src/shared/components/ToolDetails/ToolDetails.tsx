import React from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  CardActionArea,
  Chip,
  Container,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { CheckCircleOutline, ExpandMore } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { findToolById, getCategoryOfTool } from '../../data/toolsData';
import { getToolDetails } from '../../data/toolDetails';

interface ToolDetailsProps {
  toolId: string;
}

/**
 * SEO-rich details rendered below every tool: about, features, how-to,
 * use cases, FAQs and related tools. Content comes from the toolDetails
 * registry; the same content feeds the prerendered meta tags.
 */
const ToolDetails: React.FC<ToolDetailsProps> = ({ toolId }) => {
  const navigate = useNavigate();
  const tool = findToolById(toolId);
  const category = getCategoryOfTool(toolId);
  const details = getToolDetails(toolId);

  if (!tool || !details) {
    return null;
  }

  const related = (category?.items ?? []).filter((item) => item.id !== toolId).slice(0, 4);

  return (
    <Box component="section" sx={{ borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        {/* About */}
        <Typography variant="h5" component="h2" gutterBottom sx={{
          fontWeight: 700
        }}>
          About {tool.name}
        </Typography>
        <Stack spacing={1.5} sx={{ maxWidth: 860 }}>
          {details.longDescription.map((paragraph) => (
            <Typography key={paragraph} sx={{
              color: "text.secondary"
            }}>
              {paragraph}
            </Typography>
          ))}
        </Stack>

        {/* Features + How to */}
        <Grid container spacing={4} sx={{ mt: 1 }}>
          <Grid
            size={{
              xs: 12,
              md: 7
            }}>
            <Typography variant="h6" component="h3" gutterBottom sx={{
              fontWeight: 700
            }}>
              Key features
            </Typography>
            <Grid container spacing={1}>
              {details.features.map((feature) => (
                <Grid
                  key={feature}
                  size={{
                    xs: 12,
                    sm: 6
                  }}>
                  <Stack direction="row" spacing={1} sx={{
                    alignItems: "flex-start"
                  }}>
                    <CheckCircleOutline sx={{ fontSize: 18, mt: '3px', color: tool.color }} />
                    <Typography variant="body2" sx={{
                      color: "text.secondary"
                    }}>
                      {feature}
                    </Typography>
                  </Stack>
                </Grid>
              ))}
            </Grid>
          </Grid>
          <Grid
            size={{
              xs: 12,
              md: 5
            }}>
            <Typography variant="h6" component="h3" gutterBottom sx={{
              fontWeight: 700
            }}>
              How to use
            </Typography>
            <Stack spacing={1.25}>
              {details.howTo.map((step, index) => (
                <Stack key={step} direction="row" spacing={1.5} sx={{
                  alignItems: "flex-start"
                }}>
                  <Box
                    sx={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      bgcolor: tool.color,
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 700,
                      flexShrink: 0,
                      mt: '1px',
                    }}
                  >
                    {index + 1}
                  </Box>
                  <Typography variant="body2" sx={{
                    color: "text.secondary"
                  }}>
                    {step}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Grid>
        </Grid>

        {/* Use cases */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" component="h3" gutterBottom sx={{
            fontWeight: 700
          }}>
            Popular use cases
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap sx={{
            flexWrap: "wrap"
          }}>
            {details.useCases.map((useCase) => (
              <Chip key={useCase} label={useCase} variant="outlined" sx={{ borderRadius: 1.5 }} />
            ))}
          </Stack>
        </Box>

        {/* FAQs */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" component="h3" gutterBottom sx={{
            fontWeight: 700
          }}>
            Frequently asked questions
          </Typography>
          <Box>
            {details.faqs.map((faq) => (
              <Accordion key={faq.question} disableGutters elevation={0} sx={{ border: 1, borderColor: 'divider', '&:not(:last-child)': { borderBottom: 0 }, '&::before': { display: 'none' } }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="body2" sx={{
                    fontWeight: 600
                  }}>
                    {faq.question}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
                  <Typography variant="body2" sx={{
                    color: "text.secondary"
                  }}>
                    {faq.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </Box>

        {/* Related tools */}
        {related.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Divider sx={{ mb: 3 }} />
            <Typography variant="h6" component="h3" gutterBottom sx={{
              fontWeight: 700
            }}>
              More {category?.category ?? 'related tools'}
            </Typography>
            <Grid container spacing={1.5}>
              {related.map((item) => (
                <Grid
                  key={item.id}
                  size={{
                    xs: 12,
                    sm: 6,
                    md: 3
                  }}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardActionArea onClick={() => navigate(item.url)} sx={{ p: 1.5, height: '100%', alignItems: 'flex-start' }}>
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{
                          alignItems: "center",
                          mb: 0.5
                        }}>
                        <Box
                          component={item.icon}
                          sx={{ width: 18, height: 18, color: item.color, flexShrink: 0 }}
                        />
                        <Typography variant="body2" noWrap sx={{
                          fontWeight: 600
                        }}>
                          {item.name}
                        </Typography>
                      </Stack>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                        {item.description}
                      </Typography>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default ToolDetails;
