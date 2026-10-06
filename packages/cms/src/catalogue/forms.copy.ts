/**
 * The words of the website's forms as they were before the CMS: the security check and the
 * send step every form shares, and the legal request and grievance forms. Validation messages
 * are copy too; the rules they belong to stay in the website's code.
 */

/** The maths security check under every form. */
export const FORM_CAPTCHA_COPY = {
  label: 'Security Check',
  placeholder: 'Answer',
  hint: 'Type the answer to the sum. It stops automated spam.',
  refreshTitle: 'New question',
  refreshLabel: 'Show a new security question',
};

/** What the send step says while the question loads, when it fails and when a send fails. */
export const FORM_STATUS_COPY = {
  loading: 'Loading…',
  loadFailed: 'The security question could not be loaded. Please refresh it.',
  incorrect: 'That answer was not right. Please try the new question.',
  failed: 'Something went wrong. Please try again.',
};

export const LEGAL_FORM_PROPS = {
  copy: {
    ...{
      formLabel: 'Legal request',
      success: 'Your legal request has been submitted. We will review it and respond promptly.',
      fields: {
        name: {
          label: 'Your Name',
          placeholder: 'Enter your full name',
        },
        email: {
          label: 'Your Email',
          placeholder: 'you@example.com',
        },
        url: {
          label: 'URL(s) of Concerned Content',
          placeholder: 'https://example.com/page-or-image',
        },
        details: {
          label: 'Details of Your Request',
          placeholder:
            'Describe your legal concern, including any supporting information or documentation.',
        },
      },
      type: {
        label: 'Type of Legal Request',
        placeholder: 'Select an option',
      },
      types: [
        {
          value: 'copyright',
          label: 'Copyright Infringement',
        },
        {
          value: 'image-takedown',
          label: 'Image Takedown Request',
        },
        {
          value: 'content-takedown',
          label: 'Content Takedown Request',
        },
        {
          value: 'trademark',
          label: 'Trademark Concern',
        },
        {
          value: 'privacy',
          label: 'Privacy/Data Request',
        },
        {
          value: 'other',
          label: 'Other Legal Issue',
        },
      ],
      submit: 'Submit Legal Request',
      sending: 'Submitting...',
      finePrint:
        'By submitting, you confirm that the information provided is accurate and you have the authority to make this request. Exyconn will review and respond in accordance with applicable law and our policies.',
      messages: {
        nameRequired: 'Name is required',
        tooShort: 'Too short!',
        tooLong: 'Too long!',
        emailRequired: 'Email is required',
        emailInvalid: 'Invalid email address',
        typeRequired: 'Please select a type of legal request',
        urlInvalid: 'Please enter a valid URL',
        detailsRequired: 'Details are required',
        detailsTooShort: 'Please provide more details',
        detailsTooLong: 'Details are too long!',
        captchaRequired: 'Please solve the captcha',
      },
    },
    captcha: FORM_CAPTCHA_COPY,
    status: FORM_STATUS_COPY,
  },
};

export const GRIEVANCE_FORM_PROPS = {
  copy: {
    ...{
      formLabel: 'Grievance',
      success: 'Your grievance has been submitted. We will review it and get back to you.',
      fields: {
        name: {
          label: 'Your Name',
          placeholder: 'Enter your full name',
        },
        email: {
          label: 'Your Email',
          placeholder: 'you@example.com',
        },
        subject: {
          label: 'Subject',
          placeholder: 'Brief description of your grievance',
        },
        message: {
          label: 'Grievance Details',
          placeholder: 'Please provide detailed information about your grievance...',
        },
      },
      submit: 'Submit Grievance',
      sending: 'Submitting...',
      finePrint:
        "By submitting, you agree that your grievance will be reviewed in accordance with Exyconn's grievance redressal policy.",
      messages: {
        nameRequired: 'Name is required',
        tooShort: 'Too short!',
        tooLong: 'Too long!',
        emailRequired: 'Email is required',
        emailInvalid: 'Invalid email address',
        subjectRequired: 'Subject is required',
        subjectTooShort: 'Subject is too short!',
        subjectTooLong: 'Subject is too long!',
        messageRequired: 'Grievance details are required',
        messageTooShort: 'Please provide more details about your grievance',
        messageTooLong: 'Message is too long!',
        captchaRequired: 'Please solve the captcha',
      },
    },
    captcha: FORM_CAPTCHA_COPY,
    status: FORM_STATUS_COPY,
  },
};
