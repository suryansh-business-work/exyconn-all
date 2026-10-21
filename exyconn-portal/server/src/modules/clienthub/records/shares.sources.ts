import { isValidObjectId } from 'mongoose';
import { badRequest, notFound } from '../../../utils/errors';
import { sanitizeRichHtml } from '../../../utils/sanitizeHtml';
import { ContractModel } from '../../legal/legal.model';
import { LegalDocumentModel } from '../../legal/document.model';
import { PolicyModel } from '../../legal/policy.model';
import { ContractSignatureModel } from '../../legal/signature.model';
import type { SharedItemKind } from './client-shared-item.model';

/** What the hub shows of a shared Legal record, read live from the record itself. */
export interface SourceView {
  title: string;
  status: string;
  /** The file to open (a contract's document, a document's file); '' when there is none. */
  fileUrl: string;
  hasContent: boolean;
  effectiveDate: Date | null;
  expiryDate: Date | null;
  /** The latest counterparty signature on a contract; null otherwise. */
  signedAt: Date | null;
  signedBy: string | null;
}

/** Policies a client may be given: published, and not written for HR's eyes only. */
const SHAREABLE_POLICY = { status: 'PUBLISHED', audience: { $ne: 'HR_ONLY' } };
/** An archived document is withdrawn; it is not handed to a client. */
const SHAREABLE_DOCUMENT = { status: { $ne: 'ARCHIVED' } };
/** The picker lists the most recently changed records; plenty for a share dialog. */
const OPTION_LIMIT = 200;

const filled = (html: string | null | undefined) => (html ?? '').trim() !== '';
const validIds = (ids: readonly string[]) => ids.filter((id) => isValidObjectId(id));

async function contractViews(ids: readonly string[]): Promise<Map<string, SourceView>> {
  const [contracts, signatures] = await Promise.all([
    ContractModel.find({ _id: { $in: validIds(ids) } }).lean(),
    ContractSignatureModel.find({ contractId: { $in: ids }, signedAt: { $ne: null } })
      .sort({ signedAt: -1 })
      .select('contractId signedAt signedName')
      .lean(),
  ]);
  const latest = new Map<string, (typeof signatures)[number]>();
  for (const signature of signatures) {
    if (!latest.has(signature.contractId)) {
      latest.set(signature.contractId, signature);
    }
  }
  return new Map(
    contracts.map((contract) => {
      const id = String(contract._id);
      const signature = latest.get(id);
      return [
        id,
        {
          title: contract.title,
          status: contract.status,
          fileUrl: contract.documentUrl ?? '',
          hasContent: filled(contract.content),
          effectiveDate: contract.effectiveDate,
          expiryDate: contract.expiryDate,
          signedAt: signature?.signedAt ?? null,
          signedBy: signature?.signedName ?? null,
        },
      ];
    }),
  );
}

async function documentViews(ids: readonly string[]): Promise<Map<string, SourceView>> {
  const documents = await LegalDocumentModel.find({ _id: { $in: validIds(ids) } }).lean();
  return new Map(
    documents.map((doc) => [
      String(doc._id),
      {
        title: doc.title,
        status: doc.status,
        fileUrl: doc.fileUrl ?? '',
        hasContent: filled(doc.content),
        effectiveDate: null,
        expiryDate: null,
        signedAt: null,
        signedBy: null,
      },
    ]),
  );
}

async function policyViews(ids: readonly string[]): Promise<Map<string, SourceView>> {
  const policies = await PolicyModel.find({ _id: { $in: validIds(ids) } }).lean();
  return new Map(
    policies.map((policy) => [
      String(policy._id),
      {
        title: policy.title,
        status: policy.status,
        fileUrl: '',
        hasContent: filled(policy.body),
        effectiveDate: policy.effectiveDate,
        expiryDate: null,
        signedAt: null,
        signedBy: null,
      },
    ]),
  );
}

const VIEWS: Record<SharedItemKind, (ids: readonly string[]) => Promise<Map<string, SourceView>>> =
  { CONTRACT: contractViews, DOCUMENT: documentViews, POLICY: policyViews };

/** The live view of each shared record, keyed `KIND:id`; a deleted record is simply absent. */
export async function sourceViews(
  items: ReadonlyArray<{ kind: string; refId: string }>,
): Promise<Map<string, SourceView>> {
  const kinds = Object.keys(VIEWS) as SharedItemKind[];
  const maps = await Promise.all(
    kinds.map((kind) => {
      const ids = items.filter((item) => item.kind === kind).map((item) => item.refId);
      return ids.length > 0 ? VIEWS[kind](ids) : Promise.resolve(new Map<string, SourceView>());
    }),
  );
  const all = new Map<string, SourceView>();
  maps.forEach((map, index) => {
    map.forEach((view, id) => all.set(`${kinds[index]}:${id}`, view));
  });
  return all;
}

/** The record's own text as sanitised HTML, for the hub's reader. */
export async function sourceContent(kind: SharedItemKind, refId: string): Promise<string> {
  // A share's refId was checked to be a real record when it was shared.
  return sanitizeRichHtml((await rawContent(kind, refId)) ?? '');
}

async function rawContent(kind: SharedItemKind, id: string) {
  if (kind === 'CONTRACT') {
    return (await ContractModel.findById(id).select('content').lean())?.content;
  }
  if (kind === 'DOCUMENT') {
    return (await LegalDocumentModel.findById(id).select('content').lean())?.content;
  }
  return (await PolicyModel.findById(id).select('body').lean())?.body;
}

/** The record about to be shared, or a plain refusal when it cannot be shared with a client. */
export async function assertShareable(kind: SharedItemKind, refId: string): Promise<void> {
  if (!isValidObjectId(refId)) {
    notFound('Record');
  }
  if (kind === 'CONTRACT') {
    if (!(await ContractModel.exists({ _id: refId }))) {
      notFound('Contract');
    }
    return;
  }
  if (kind === 'DOCUMENT') {
    if (!(await LegalDocumentModel.exists({ _id: refId, ...SHAREABLE_DOCUMENT }))) {
      badRequest('Only a draft or final document can be shared.');
    }
    return;
  }
  if (!(await PolicyModel.exists({ _id: refId, ...SHAREABLE_POLICY }))) {
    badRequest('Only a published policy that is not HR-only can be shared.');
  }
}

/** Records of one kind a client could be given, most recently changed first, for the picker. */
export async function shareOptions(kind: SharedItemKind) {
  const recent = { sort: { updatedAt: -1 as const }, limit: OPTION_LIMIT };
  let rows: Array<{ _id: unknown; title: string; status: string }>;
  if (kind === 'CONTRACT') {
    rows = await ContractModel.find({}, 'title status', recent).lean();
  } else if (kind === 'DOCUMENT') {
    rows = await LegalDocumentModel.find(SHAREABLE_DOCUMENT, 'title status', recent).lean();
  } else {
    rows = await PolicyModel.find(SHAREABLE_POLICY, 'title status', recent).lean();
  }
  return rows.map((row) => ({ id: String(row._id), title: row.title, status: row.status }));
}
