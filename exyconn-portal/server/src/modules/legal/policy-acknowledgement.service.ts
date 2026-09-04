import { PolicyModel } from './policy.model';
import { PolicyAcknowledgementModel } from './policy-acknowledgement.model';
import { UserModel } from '../admin/user.model';
import { emailer } from '../email';
import { badRequest, notFound } from '../../utils/errors';
import { logger } from '../../utils/logger';

/** The template Legal sends when somebody signs. Authored in Tech → Email. */
const ACKNOWLEDGED_TEMPLATE = 'policy-acknowledged';

/**
 * Recording a signature on a policy — the ONE place it happens.
 *
 * Both the Legal portal's `acknowledgePolicy` mutation and the desktop tracker's consent
 * screen come through here, so a tracking disclosure accepted in the app produces exactly
 * the same versioned record as a policy signed in the portal. Two implementations would
 * eventually disagree about what counts as a signature, and the whole value of the ledger is
 * that it does not.
 */
class PolicyAcknowledgementService {
  /**
   * Signs the version of `policyId` currently published, as `userId`.
   *
   * The signer is the caller's own identity, never an argument: `signedName` is only what
   * they typed. Signing a version already signed is refused rather than duplicated.
   */
  async sign(userId: string, policyId: string, signedName: string) {
    const policy = await PolicyModel.findById(policyId).lean();
    if (!policy || policy.status !== 'PUBLISHED') {
      notFound('Policy');
    }
    const name = signedName.trim();
    if (name === '') {
      badRequest('Type your name to sign.');
    }

    const existing = await PolicyAcknowledgementModel.findOne({
      policyId,
      userId,
      version: policy.version,
    }).lean();
    if (existing) {
      badRequest(`You have already signed version ${policy.version} of "${policy.title}".`);
    }

    // The token carries an id and an email, not a name — and a signature record that says
    // only "user-64f2…" is no use to whoever reads it back in two years.
    const account = await UserModel.findById(userId).select('name email').lean();

    const record = await PolicyAcknowledgementModel.create({
      policyId,
      policyTitle: policy.title,
      version: policy.version,
      userId,
      userName: account?.name ?? '',
      userEmail: account?.email ?? '',
      signedName: name,
      signedAt: new Date(),
    });

    this.confirm(account?.email ?? '', account?.name ?? '', policy.title, policy.version, name);
    return record.toObject();
  }

  /**
   * Emails the signer their own copy of what they agreed to and when.
   *
   * Fire-and-forget on purpose: a mail server that is down must not undo a signature that
   * has already been recorded, so the failure is logged and the signature stands.
   */
  private confirm(
    email: string,
    name: string,
    policyTitle: string,
    version: number,
    signedName: string,
  ): void {
    if (email === '') {
      return;
    }
    emailer
      .send({
        template: ACKNOWLEDGED_TEMPLATE,
        to: email,
        variables: {
          name: name || email,
          policyTitle,
          version: String(version),
          signedName,
          signedAt: new Date().toISOString(),
        },
        triggeredBy: email,
      })
      .catch((error: unknown) => {
        logger.error({ err: error }, `Policy acknowledgement email to ${email} failed`);
      });
  }
}

export const policyAcknowledgementService = new PolicyAcknowledgementService();
