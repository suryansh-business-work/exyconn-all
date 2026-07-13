import React from 'react';
import {
  Box,
  TextField,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  
  Switch,
  FormControlLabel,
  InputAdornment,
  alpha,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { ExpandMore, Share, LinkedIn, X, Facebook, Instagram, GitHub, Language } from '@mui/icons-material';
import { FormikProps } from 'formik';
import { SignatureFormValues, SocialLink } from '../types';

interface SocialLinksFormProps {
  formik: FormikProps<SignatureFormValues>;
}

const platformIcons: Record<string, React.ReactNode> = {
  linkedin: <LinkedIn fontSize="small" />,
  twitter: <X fontSize="small" />,
  facebook: <Facebook fontSize="small" />,
  instagram: <Instagram fontSize="small" />,
  github: <GitHub fontSize="small" />,
  website: <Language fontSize="small" />,
};

const platformLabels: Record<string, string> = {
  linkedin: 'LinkedIn',
  twitter: 'X (Twitter)',
  facebook: 'Facebook',
  instagram: 'Instagram',
  github: 'GitHub',
  website: 'Website',
};

const platformPlaceholders: Record<string, string> = {
  linkedin: 'https://linkedin.com/in/yourprofile',
  twitter: 'https://x.com/yourhandle',
  facebook: 'https://facebook.com/yourpage',
  instagram: 'https://instagram.com/yourhandle',
  github: 'https://github.com/yourusername',
  website: 'https://yourwebsite.com',
};

const SocialLinksForm: React.FC<SocialLinksFormProps> = ({ formik }) => {
  const { values, setFieldValue } = formik;

  const handleToggle = (index: number) => {
    const newLinks = [...values.socialLinks];
    newLinks[index] = { ...newLinks[index], enabled: !newLinks[index].enabled };
    setFieldValue('socialLinks', newLinks);
  };

  const handleUrlChange = (index: number, url: string) => {
    const newLinks = [...values.socialLinks];
    newLinks[index] = { ...newLinks[index], url };
    setFieldValue('socialLinks', newLinks);
  };

  return (
    <Accordion elevation={0} sx={{ border: 1, borderColor: 'divider', '&:before': { display: 'none' } }}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Share color="primary" fontSize="small" />
          <Typography fontWeight={600}>Social Links</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
            ({values.socialLinks.filter((s: SocialLink) => s.enabled).length} active)
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={2}>
          {values.socialLinks.map((link: SocialLink, index: number) => (
            <Grid size={{ xs: 12 }} key={link.platform}>
              <Box
                sx={{
                  p: 2,
                  border: 1,
                  borderColor: link.enabled ? 'primary.main' : 'divider',
                  borderRadius: 2,
                  bgcolor: link.enabled ? alpha('#2563eb', 0.04) : 'transparent',
                  transition: 'all 0.2s',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: link.enabled ? 1.5 : 0,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {platformIcons[link.platform]}
                    <Typography variant="body2" fontWeight={500}>
                      {platformLabels[link.platform]}
                    </Typography>
                  </Box>
                  <FormControlLabel
                    control={<Switch size="small" checked={link.enabled} onChange={() => handleToggle(index)} />}
                    label=""
                    sx={{ m: 0 }}
                  />
                </Box>
                {link.enabled && (
                  <TextField
                    fullWidth
                    size="small"
                    placeholder={platformPlaceholders[link.platform]}
                    value={link.url}
                    onChange={(e) => handleUrlChange(index, e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">{platformIcons[link.platform]}</InputAdornment>,
                    }}
                  />
                )}
              </Box>
            </Grid>
          ))}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

export default SocialLinksForm;
