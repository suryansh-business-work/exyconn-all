export { emailTypeDefs } from './email.typeDefs';
export { emailResolvers, emailFragmentsService, emailTemplatesService } from './email.resolvers';
export { emailer, sendTemplateEmail, renderStoredTemplate } from './email.service';
export type { EmailAttachment, SendTemplateInput } from './email.service';
export { EmailRenderError, rawHtml } from './email.render';
export { ensureEmailDefaults } from './email.defaults';
