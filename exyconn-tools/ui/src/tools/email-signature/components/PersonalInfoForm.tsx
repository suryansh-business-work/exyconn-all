import React from 'react';
import { Box } from '@mui/material';
import { FormikProps } from 'formik';
import { SignatureFormValues } from '../types';
import PersonalInfoSection from './PersonalInfoSection';
import ContactInfoSection from './ContactInfoSection';

interface PersonalInfoFormProps {
  formik: FormikProps<SignatureFormValues>;
}

const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({ formik }) => {
  return (
    <Box>
      <PersonalInfoSection formik={formik} />
      <ContactInfoSection formik={formik} />
    </Box>
  );
};

export default PersonalInfoForm;
