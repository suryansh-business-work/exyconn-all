import { supportTypeDefs } from './support.typeDefs';
import { supportResolvers } from './support.resolvers';
// Imported for its side effect: the module registers what it wants chased.
import './support.reminders';

export { supportTypeDefs, supportResolvers };
export { SupportReplyModel } from './support-reply.model';
export { SupportSlaPolicyModel } from './sla-policy.model';
export { ensureSupportSlaPolicies, dueAtForPriority, supportSlaSummary } from './sla.service';
export { supportSlaPolicyService } from './sla.crud';
export { supportLibraryTypeDefs } from './support.library.typeDefs';
export { supportLibraryResolvers, kbArticleService, cannedReplyService } from './support.library';
export { slaState, dueAtFrom, type SlaState } from './support.sla';
export { uniqueReference } from './ticket-reference';
export { importInboundMessage, startInboundMail } from './inbound-mail';
export { stripQuotedReply } from './inbound-mail.text';
export { toAttachments, type AttachmentInput } from '../../lib/attachments';
