import React, { useEffect } from 'react';
import { Box, Paper, Tab, Tabs } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { FormikProps, useFormikContext } from 'formik';
import { Person, Image, Share, Palette, TuneRounded, Campaign } from '@mui/icons-material';

import { SignatureFormValues } from './types';
import PersonalInfoForm from './components/PersonalInfoForm';
import BrandingForm from './components/BrandingForm';
import SocialLinksForm from './components/SocialLinksForm';
import CustomFieldsForm from './components/CustomFieldsForm';
import CTADisclaimerForm from './components/CTADisclaimerForm';
import DesignOptionsForm from './components/DesignOptionsForm';
import SignaturePreview from './components/SignaturePreview';
import SignatureActions from './components/SignatureActions';

interface TabPanelProps {
  children?: React.ReactNode;
  value: number;
  index: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <Box role="tabpanel" hidden={value !== index} sx={{ display: value === index ? 'block' : 'none' }}>
    {value === index && children}
  </Box>
);

const AutoSave: React.FC<{ onSave: (values: SignatureFormValues) => void }> = ({ onSave }) => {
  const { values } = useFormikContext<SignatureFormValues>();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSave(values);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [values, onSave]);

  return null;
};

interface FormContentProps {
  formik: FormikProps<SignatureFormValues>;
  activeTab: number;
  setActiveTab: (tab: number) => void;
  isMobile: boolean;
  onReset: () => void;
  onSave: (values: SignatureFormValues) => void;
}

const FormContent: React.FC<FormContentProps> = ({
  formik,
  activeTab,
  setActiveTab,
  isMobile,
  onReset,
  onSave,
}) => {
  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <AutoSave onSave={onSave} />
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5, lg: 4 }}>
          <Paper
            elevation={0}
            sx={{
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
              overflow: 'hidden',
              position: { md: 'sticky' },
              top: { md: 80 },
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                bgcolor: 'background.default',
                '& .MuiTab-root': {
                  minHeight: 56,
                  textTransform: 'none',
                  fontWeight: 500,
                },
              }}
            >
              <Tab icon={<Person />} label="Info" iconPosition="start" />
              <Tab icon={<Image />} label="Branding" iconPosition="start" />
              <Tab icon={<Share />} label="Social" iconPosition="start" />
              <Tab icon={<TuneRounded />} label="Custom" iconPosition="start" />
              <Tab icon={<Campaign />} label="CTA" iconPosition="start" />
              <Tab icon={<Palette />} label="Design" iconPosition="start" />
            </Tabs>

            <Box sx={{ p: 2, maxHeight: { md: 'calc(100vh - 240px)' }, overflow: 'auto' }}>
              <TabPanel value={activeTab} index={0}>
                <PersonalInfoForm formik={formik} />
              </TabPanel>
              <TabPanel value={activeTab} index={1}>
                <BrandingForm formik={formik} />
              </TabPanel>
              <TabPanel value={activeTab} index={2}>
                <SocialLinksForm formik={formik} />
              </TabPanel>
              <TabPanel value={activeTab} index={3}>
                <CustomFieldsForm formik={formik} />
              </TabPanel>
              <TabPanel value={activeTab} index={4}>
                <CTADisclaimerForm formik={formik} />
              </TabPanel>
              <TabPanel value={activeTab} index={5}>
                <DesignOptionsForm formik={formik} />
              </TabPanel>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 7, lg: 8 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Paper
              elevation={0}
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 2,
                p: 2,
              }}
            >
              <SignatureActions
                values={formik.values}
                isValid={formik.isValid}
                onReset={onReset}
              />
            </Paper>

            <Box sx={{ minHeight: isMobile ? 400 : 500 }}>
              <SignaturePreview values={formik.values} />
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FormContent;
