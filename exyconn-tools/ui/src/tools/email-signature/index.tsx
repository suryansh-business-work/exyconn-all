import React, { useCallback } from 'react';
import { useTheme, useMediaQuery } from '@mui/material';
import { Formik, FormikProps } from 'formik';
import { Email } from '@mui/icons-material';

import { SignatureFormValues, defaultFormValues } from './types';
import { signatureValidationSchema } from './validation/signatureSchema';
import { useLocalStorage } from './hooks/useLocalStorage';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import FormContent from './FormContent';

const STORAGE_KEY = 'email-signature-form-data';

const EmailSignature: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeTab, setActiveTab] = React.useState(0);
  const [savedFormData, setSavedFormData, clearFormData] = useLocalStorage<SignatureFormValues>(
    STORAGE_KEY,
    defaultFormValues
  );
  // The form starts from what was saved and is never re-initialised by its own autosave:
  // reinitialising wipes the touched flags, so validation messages vanished half a second
  // after the visitor stopped typing.
  const [initialValues] = React.useState(savedFormData);

  const handleFormChange = useCallback(
    (values: SignatureFormValues) => {
      setSavedFormData(values);
    },
    [setSavedFormData]
  );

  return (
    <ToolLayout toolName="Email Signature Generator" toolIcon={<Email />} toolColor="#10b981">
      <Formik<SignatureFormValues>
        initialValues={initialValues}
        validationSchema={signatureValidationSchema}
        onSubmit={() => {}}
      >
        {(formik: FormikProps<SignatureFormValues>) => (
          <FormContent
            formik={formik}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isMobile={isMobile}
            onReset={() => {
              clearFormData();
              formik.resetForm({ values: defaultFormValues });
            }}
            onSave={handleFormChange}
          />
        )}
      </Formik>
    </ToolLayout>
  );
};

export default EmailSignature;
