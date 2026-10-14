/** The inspector form for each node type — one RHF + Zod form folder per type (rule 10). */
import type { ComponentType } from 'react';
import type { NodeType } from '@exyconn/wa-flow';
import type { NodeFormProps } from './fields/form-types';
import { TextNodeForm } from './forms/text';
import { ButtonsNodeForm } from './forms/buttons';
import { ListNodeForm } from './forms/list';
import { CtaNodeForm } from './forms/cta';
import { ImageNodeForm } from './forms/image';
import { DocumentNodeForm } from './forms/document';
import { LocationNodeForm } from './forms/location';
import { ContactNodeForm } from './forms/contact';
import { ProductNodeForm } from './forms/product';
import { CarouselNodeForm } from './forms/carousel';
import { TicketNodeForm } from './forms/ticket';
import { OrderNodeForm } from './forms/order';
import { NoticeNodeForm } from './forms/notice';
import { InputNodeForm } from './forms/input';
import { AiNodeForm } from './forms/ai';
import { ConditionNodeForm } from './forms/condition';
import { DelayNodeForm } from './forms/delay';
import { ReminderNodeForm } from './forms/reminder';
import { HandoffNodeForm } from './forms/handoff';
import { JumpNodeForm } from './forms/jump';
import { EndNodeForm } from './forms/end';

export const NODE_FORMS: { readonly [T in NodeType]: ComponentType<Readonly<NodeFormProps<T>>> } = {
  text: TextNodeForm,
  buttons: ButtonsNodeForm,
  list: ListNodeForm,
  cta: CtaNodeForm,
  image: ImageNodeForm,
  document: DocumentNodeForm,
  location: LocationNodeForm,
  contact: ContactNodeForm,
  product: ProductNodeForm,
  carousel: CarouselNodeForm,
  ticket: TicketNodeForm,
  order: OrderNodeForm,
  notice: NoticeNodeForm,
  input: InputNodeForm,
  ai: AiNodeForm,
  condition: ConditionNodeForm,
  delay: DelayNodeForm,
  reminder: ReminderNodeForm,
  handoff: HandoffNodeForm,
  jump: JumpNodeForm,
  end: EndNodeForm,
};
