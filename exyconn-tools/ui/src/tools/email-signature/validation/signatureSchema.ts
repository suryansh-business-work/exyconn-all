import * as Yup from 'yup';

const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;

export const signatureValidationSchema = Yup.object().shape({
  // Personal Info - Name is required
  fullName: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .required('Full name is required'),

  jobTitle: Yup.string().max(100, 'Job title must be less than 100 characters'),

  department: Yup.string().max(100, 'Department must be less than 100 characters'),

  company: Yup.string().max(100, 'Company name must be less than 100 characters'),

  // Contact Info
  email: Yup.string().email('Please enter a valid email address'),

  phone: Yup.string().max(30, 'Phone number must be less than 30 characters'),

  mobile: Yup.string().max(30, 'Mobile number must be less than 30 characters'),

  address: Yup.string().max(200, 'Address must be less than 200 characters'),

  // URLs
  logoUrl: Yup.string().matches(urlRegex, { message: 'Please enter a valid URL', excludeEmptyString: true }),

  profilePhotoUrl: Yup.string().matches(urlRegex, { message: 'Please enter a valid URL', excludeEmptyString: true }),

  bannerUrl: Yup.string().matches(urlRegex, { message: 'Please enter a valid URL', excludeEmptyString: true }),

  // CTA
  ctaText: Yup.string().max(50, 'CTA text must be less than 50 characters'),

  ctaUrl: Yup.string().matches(urlRegex, { message: 'Please enter a valid URL', excludeEmptyString: true }),

  // Social Links validation
  socialLinks: Yup.array().of(
    Yup.object().shape({
      platform: Yup.string().required(),
      url: Yup.string().when('enabled', {
        is: true,
        then: (schema) => schema.matches(urlRegex, 'Please enter a valid URL'),
        otherwise: (schema) => schema,
      }),
      enabled: Yup.boolean(),
    })
  ),

  // Custom Fields
  customFields: Yup.array().of(
    Yup.object().shape({
      id: Yup.string().required(),
      label: Yup.string().required('Label is required').max(50, 'Label too long'),
      value: Yup.string().required('Value is required').max(200, 'Value too long'),
      type: Yup.string().oneOf(['text', 'link', 'phone']).required(),
    })
  ),

  // Design
  template: Yup.string().oneOf(['professional', 'modern', 'minimal', 'creative']).required(),
  primaryColor: Yup.string().required(),
  secondaryColor: Yup.string().required(),
  fontFamily: Yup.string().required(),
  fontSize: Yup.string().oneOf(['small', 'medium', 'large']).required(),
});
