import { SignatureFormValues, fontSizes } from '../types';

// Social icons as inline SVG for email compatibility
const socialIcons: Record<string, string> = {
  linkedin: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>`,
  twitter: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
  facebook: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/></svg>`,
  instagram: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/></svg>`,
  github: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/></svg>`,
  website: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2m-5.15 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 0 1-4.33 3.56M14.34 14H9.66c-.1-.66-.16-1.32-.16-2 0-.68.06-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2M12 19.96c-.83-1.2-1.5-2.53-1.91-3.96h3.82c-.41 1.43-1.08 2.76-1.91 3.96M8 8H5.08A7.923 7.923 0 0 1 9.4 4.44C8.8 5.55 8.35 6.75 8 8m-2.92 8H8c.35 1.25.8 2.45 1.4 3.56A8.008 8.008 0 0 1 5.08 16m-.82-2C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2M12 4.03c.83 1.2 1.5 2.54 1.91 3.97h-3.82c.41-1.43 1.08-2.77 1.91-3.97M18.92 8h-2.95a15.65 15.65 0 0 0-1.38-3.56c1.84.63 3.37 1.9 4.33 3.56M12 2C6.47 2 2 6.5 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2z"/></svg>`,
};

// Platform colors for social icons
const socialColors: Record<string, string> = {
  linkedin: '#0077B5',
  twitter: '#000000',
  facebook: '#1877F2',
  instagram: '#E4405F',
  github: '#333333',
  website: '#555555',
};

export function generateSignatureHTML(values: SignatureFormValues): string {
  const sizes = fontSizes[values.fontSize];
  const enabledSocialLinks = values.socialLinks.filter((s) => s.enabled && s.url);

  // Generate social icons HTML
  const socialHTML =
    enabledSocialLinks.length > 0
      ? `
    <tr>
      <td style="padding: 12px 0 0 0;">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            ${enabledSocialLinks
              .map(
                (link) => `
              <td style="padding-right: 8px;">
                <a href="${link.url}" target="_blank" style="text-decoration: none; color: ${socialColors[link.platform]};">
                  ${socialIcons[link.platform]}
                </a>
              </td>
            `
              )
              .join('')}
          </tr>
        </table>
      </td>
    </tr>
  `
      : '';

  // Generate custom fields HTML
  const customFieldsHTML = values.customFields
    .map((field) => {
      if (field.type === 'link') {
        return `<tr><td style="font-size: ${sizes.company}px; color: ${values.secondaryColor}; padding: 2px 0;"><strong>${field.label}:</strong> <a href="${field.value}" style="color: ${values.primaryColor}; text-decoration: none;">${field.value}</a></td></tr>`;
      } else if (field.type === 'phone') {
        return `<tr><td style="font-size: ${sizes.company}px; color: ${values.secondaryColor}; padding: 2px 0;"><strong>${field.label}:</strong> <a href="tel:${field.value}" style="color: ${values.primaryColor}; text-decoration: none;">${field.value}</a></td></tr>`;
      }
      return `<tr><td style="font-size: ${sizes.company}px; color: ${values.secondaryColor}; padding: 2px 0;"><strong>${field.label}:</strong> ${field.value}</td></tr>`;
    })
    .join('');

  // Generate CTA button HTML
  const ctaHTML =
    values.ctaText && values.ctaUrl
      ? `
    <tr>
      <td style="padding: 12px 0 0 0;">
        <a href="${values.ctaUrl}" target="_blank" style="display: inline-block; padding: 8px 16px; background: ${values.primaryColor}; color: #ffffff; text-decoration: none; border-radius: 4px; font-size: ${sizes.company}px; font-weight: 600;">
          ${values.ctaText}
        </a>
      </td>
    </tr>
  `
      : '';

  // Generate banner HTML
  const bannerHTML = values.bannerUrl
    ? `
    <tr>
      <td style="padding: 16px 0 0 0;">
        <a href="${values.ctaUrl || '#'}" target="_blank">
          <img src="${values.bannerUrl}" alt="Banner" style="max-width: 400px; height: auto; border-radius: 4px;" />
        </a>
      </td>
    </tr>
  `
    : '';

  // Generate disclaimer HTML
  const disclaimerHTML = values.disclaimer
    ? `
    <tr>
      <td style="padding: 12px 0 0 0; font-size: 10px; color: #94a3b8; line-height: 1.4;">
        ${values.disclaimer}
      </td>
    </tr>
  `
    : '';

  // Generate template-specific layouts
  switch (values.template) {
    case 'modern':
      return generateModernTemplate(values, sizes, socialHTML, customFieldsHTML, ctaHTML, bannerHTML, disclaimerHTML);
    case 'minimal':
      return generateMinimalTemplate(values, sizes, socialHTML, customFieldsHTML, ctaHTML, disclaimerHTML);
    case 'creative':
      return generateCreativeTemplate(values, sizes, socialHTML, customFieldsHTML, ctaHTML, bannerHTML, disclaimerHTML);
    default:
      return generateProfessionalTemplate(
        values,
        sizes,
        socialHTML,
        customFieldsHTML,
        ctaHTML,
        bannerHTML,
        disclaimerHTML
      );
  }
}

function generateProfessionalTemplate(
  values: SignatureFormValues,
  sizes: { name: number; title: number; company: number },
  socialHTML: string,
  customFieldsHTML: string,
  ctaHTML: string,
  bannerHTML: string,
  disclaimerHTML: string
): string {
  return `
<table cellpadding="0" cellspacing="0" border="0" style="font-family: ${values.fontFamily}; max-width: 500px;">
  <tr>
    <td style="padding: 0;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          ${
            values.profilePhotoUrl
              ? `
          <td style="vertical-align: top; padding-right: 16px;">
            <img src="${values.profilePhotoUrl}" alt="${values.fullName}" width="80" height="80" style="border-radius: 50%; object-fit: cover;" />
          </td>
          `
              : ''
          }
          <td style="vertical-align: top;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="font-size: ${sizes.title}px; font-weight: 700; color: ${values.primaryColor}; padding-bottom: 4px;">
                  ${values.fullName}
                </td>
              </tr>
              ${
                values.jobTitle
                  ? `
              <tr>
                <td style="font-size: ${sizes.name}px; color: #334155; padding-bottom: 2px;">
                  ${values.jobTitle}${values.department ? ` | ${values.department}` : ''}
                </td>
              </tr>
              `
                  : ''
              }
              ${
                values.company
                  ? `
              <tr>
                <td style="font-size: ${sizes.company}px; font-weight: 600; color: ${values.secondaryColor}; padding-bottom: 8px;">
                  ${values.company}
                </td>
              </tr>
              `
                  : ''
              }
              <tr>
                <td style="border-top: 2px solid ${values.primaryColor}; padding-top: 8px;">
                  <table cellpadding="0" cellspacing="0" border="0">
                    ${
                      values.email
                        ? `
                    <tr>
                      <td style="font-size: ${sizes.company}px; color: ${values.secondaryColor}; padding: 2px 0;">
                        <a href="mailto:${values.email}" style="color: ${values.primaryColor}; text-decoration: none;">${values.email}</a>
                      </td>
                    </tr>
                    `
                        : ''
                    }
                    ${
                      values.phone
                        ? `
                    <tr>
                      <td style="font-size: ${sizes.company}px; color: ${values.secondaryColor}; padding: 2px 0;">
                        <a href="tel:${values.phone}" style="color: ${values.secondaryColor}; text-decoration: none;">${values.phone}</a>
                      </td>
                    </tr>
                    `
                        : ''
                    }
                    ${
                      values.mobile
                        ? `
                    <tr>
                      <td style="font-size: ${sizes.company}px; color: ${values.secondaryColor}; padding: 2px 0;">
                        <a href="tel:${values.mobile}" style="color: ${values.secondaryColor}; text-decoration: none;">${values.mobile}</a>
                      </td>
                    </tr>
                    `
                        : ''
                    }
                    ${
                      values.address
                        ? `
                    <tr>
                      <td style="font-size: ${sizes.company}px; color: ${values.secondaryColor}; padding: 2px 0;">
                        ${values.address}
                      </td>
                    </tr>
                    `
                        : ''
                    }
                    ${customFieldsHTML}
                  </table>
                </td>
              </tr>
              ${socialHTML}
              ${ctaHTML}
            </table>
          </td>
          ${
            values.logoUrl
              ? `
          <td style="vertical-align: top; padding-left: 20px;">
            <img src="${values.logoUrl}" alt="Logo" width="100" style="max-height: 60px; object-fit: contain;" />
          </td>
          `
              : ''
          }
        </tr>
      </table>
    </td>
  </tr>
  ${bannerHTML}
  ${disclaimerHTML}
</table>
  `.trim();
}

function generateModernTemplate(
  values: SignatureFormValues,
  sizes: { name: number; title: number; company: number },
  socialHTML: string,
  customFieldsHTML: string,
  ctaHTML: string,
  bannerHTML: string,
  disclaimerHTML: string
): string {
  return `
<table cellpadding="0" cellspacing="0" border="0" style="font-family: ${values.fontFamily}; max-width: 500px;">
  <tr>
    <td style="background: linear-gradient(135deg, ${values.primaryColor}15, ${values.primaryColor}05); padding: 20px; border-radius: 12px; border-left: 4px solid ${values.primaryColor};">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          ${
            values.profilePhotoUrl
              ? `
          <td style="vertical-align: top; padding-right: 16px; width: 90px;">
            <img src="${values.profilePhotoUrl}" alt="${values.fullName}" width="80" height="80" style="border-radius: 12px; object-fit: cover; border: 2px solid ${values.primaryColor};" />
          </td>
          `
              : ''
          }
          <td style="vertical-align: top;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="font-size: ${sizes.title}px; font-weight: 700; color: ${values.primaryColor};">
                  ${values.fullName}
                </td>
              </tr>
              ${
                values.jobTitle
                  ? `
              <tr>
                <td style="font-size: ${sizes.name}px; color: #475569; padding-top: 4px;">
                  ${values.jobTitle}
                </td>
              </tr>
              `
                  : ''
              }
              ${
                values.company
                  ? `
              <tr>
                <td style="font-size: ${sizes.company}px; color: ${values.secondaryColor}; padding-top: 2px;">
                  ${values.company}${values.department ? ` • ${values.department}` : ''}
                </td>
              </tr>
              `
                  : ''
              }
              <tr>
                <td style="padding-top: 12px;">
                  <table cellpadding="0" cellspacing="0" border="0">
                    ${
                      values.email
                        ? `
                    <tr><td style="font-size: ${sizes.company}px; padding: 2px 0;"><a href="mailto:${values.email}" style="color: ${values.primaryColor}; text-decoration: none;">✉️ ${values.email}</a></td></tr>
                    `
                        : ''
                    }
                    ${
                      values.phone
                        ? `
                    <tr><td style="font-size: ${sizes.company}px; padding: 2px 0;"><a href="tel:${values.phone}" style="color: #475569; text-decoration: none;">📞 ${values.phone}</a></td></tr>
                    `
                        : ''
                    }
                    ${
                      values.address
                        ? `
                    <tr><td style="font-size: ${sizes.company}px; color: #64748b; padding: 2px 0;">📍 ${values.address}</td></tr>
                    `
                        : ''
                    }
                    ${customFieldsHTML}
                  </table>
                </td>
              </tr>
              ${socialHTML}
              ${ctaHTML}
            </table>
          </td>
          ${
            values.logoUrl
              ? `
          <td style="vertical-align: top; text-align: right; width: 100px;">
            <img src="${values.logoUrl}" alt="Logo" width="80" style="max-height: 50px; object-fit: contain;" />
          </td>
          `
              : ''
          }
        </tr>
      </table>
    </td>
  </tr>
  ${bannerHTML}
  ${disclaimerHTML}
</table>
  `.trim();
}

function generateMinimalTemplate(
  values: SignatureFormValues,
  sizes: { name: number; title: number; company: number },
  socialHTML: string,
  customFieldsHTML: string,
  ctaHTML: string,
  disclaimerHTML: string
): string {
  const contacts = [
    values.email &&
      `<a href="mailto:${values.email}" style="color: ${values.primaryColor}; text-decoration: none;">${values.email}</a>`,
    values.phone &&
      `<a href="tel:${values.phone}" style="color: ${values.secondaryColor}; text-decoration: none;">${values.phone}</a>`,
  ]
    .filter(Boolean)
    .join(' • ');

  return `
<table cellpadding="0" cellspacing="0" border="0" style="font-family: ${values.fontFamily}; max-width: 500px;">
  <tr>
    <td>
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="font-size: ${sizes.title}px; font-weight: 600; color: #1e293b;">
            ${values.fullName}
          </td>
        </tr>
        ${
          values.jobTitle || values.company
            ? `
        <tr>
          <td style="font-size: ${sizes.company}px; color: ${values.secondaryColor}; padding-top: 2px;">
            ${[values.jobTitle, values.company].filter(Boolean).join(' @ ')}
          </td>
        </tr>
        `
            : ''
        }
        ${
          contacts
            ? `
        <tr>
          <td style="font-size: ${sizes.company}px; color: ${values.secondaryColor}; padding-top: 8px; border-top: 1px solid #e2e8f0; margin-top: 8px;">
            ${contacts}
          </td>
        </tr>
        `
            : ''
        }
        ${customFieldsHTML ? `<tr><td style="padding-top: 4px;"><table>${customFieldsHTML}</table></td></tr>` : ''}
        ${socialHTML}
        ${ctaHTML}
        ${disclaimerHTML}
      </table>
    </td>
  </tr>
</table>
  `.trim();
}

function generateCreativeTemplate(
  values: SignatureFormValues,
  sizes: { name: number; title: number; company: number },
  socialHTML: string,
  customFieldsHTML: string,
  ctaHTML: string,
  bannerHTML: string,
  disclaimerHTML: string
): string {
  return `
<table cellpadding="0" cellspacing="0" border="0" style="font-family: ${values.fontFamily}; max-width: 500px;">
  <tr>
    <td style="padding: 20px; background: linear-gradient(135deg, ${values.primaryColor}, ${values.secondaryColor}); border-radius: 16px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="background: #ffffff; border-radius: 12px; padding: 20px;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                ${
                  values.profilePhotoUrl
                    ? `
                <td style="vertical-align: top; padding-right: 16px;">
                  <img src="${values.profilePhotoUrl}" alt="${values.fullName}" width="90" height="90" style="border-radius: 50%; object-fit: cover; border: 3px solid ${values.primaryColor};" />
                </td>
                `
                    : ''
                }
                <td style="vertical-align: middle;">
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="font-size: ${sizes.title + 2}px; font-weight: 800; color: ${values.primaryColor};">
                        ${values.fullName}
                      </td>
                    </tr>
                    ${
                      values.jobTitle
                        ? `
                    <tr>
                      <td style="font-size: ${sizes.name}px; color: #334155; padding-top: 4px; font-weight: 500;">
                        ${values.jobTitle}
                      </td>
                    </tr>
                    `
                        : ''
                    }
                    ${
                      values.company
                        ? `
                    <tr>
                      <td style="font-size: ${sizes.company}px; color: ${values.secondaryColor}; padding-top: 2px;">
                        ${values.company}
                      </td>
                    </tr>
                    `
                        : ''
                    }
                  </table>
                </td>
                ${
                  values.logoUrl
                    ? `
                <td style="vertical-align: top; text-align: right;">
                  <img src="${values.logoUrl}" alt="Logo" width="70" style="max-height: 45px; object-fit: contain;" />
                </td>
                `
                    : ''
                }
              </tr>
            </table>
            <table cellpadding="0" cellspacing="0" border="0" style="margin-top: 16px; padding-top: 16px; border-top: 2px dashed ${values.primaryColor}40;">
              ${
                values.email
                  ? `
              <tr>
                <td style="font-size: ${sizes.company}px; padding: 3px 0;">
                  <a href="mailto:${values.email}" style="color: ${values.primaryColor}; text-decoration: none; font-weight: 500;">${values.email}</a>
                </td>
              </tr>
              `
                  : ''
              }
              ${
                values.phone
                  ? `
              <tr>
                <td style="font-size: ${sizes.company}px; color: ${values.secondaryColor}; padding: 3px 0;">
                  ${values.phone}
                </td>
              </tr>
              `
                  : ''
              }
              ${
                values.address
                  ? `
              <tr>
                <td style="font-size: ${sizes.company}px; color: ${values.secondaryColor}; padding: 3px 0;">
                  ${values.address}
                </td>
              </tr>
              `
                  : ''
              }
              ${customFieldsHTML}
              ${socialHTML}
              ${ctaHTML}
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  ${bannerHTML}
  ${disclaimerHTML}
</table>
  `.trim();
}
