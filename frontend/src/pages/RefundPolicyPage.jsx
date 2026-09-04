import LegalLayout from '../components/Legal/LegalLayout';

function RefundPolicyPage() {
  return (
    <LegalLayout title="Refund & Cancellation Policy" lastUpdated="September 4, 2026">
      <h2>1. Credit Purchases</h2>
      <p>
        Credits purchased on SkillBridge are generally non-refundable once used. However, you may
        request a refund on a completed, unused credit purchase by contacting us or using the
        "Request Refund" option on your Purchase History page.
      </p>

      <h2>2. Refund Review</h2>
      <p>
        Refund requests are reviewed by our team. We consider factors including whether the
        credits have already been spent on a session. Approved refunds are processed back to your
        original payment method through Safepay; processing times depend on Safepay and your
        bank/card issuer.
      </p>

      <h2>3. Partial Usage</h2>
      <p>
        If some of the credits from a purchase have already been spent before a refund is
        requested, we will note this during review — a refund may result in a proportionally
        adjusted credit deduction rather than a full reversal.
      </p>

      <h2>4. Session Cancellations</h2>
      <p>
        Cancelling a scheduled session changes its status to cancelled but does not, on its own,
        automatically refund or reverse any credits — SkillBridge does not currently apply an
        automatic time-based cancellation rule (e.g. a fixed cutoff before the session start). If
        you cancelled a session and believe you are owed a credit reversal, contact us at{' '}
        <a href="mailto:support@skill-bridge.me">support@skill-bridge.me</a> and our team will
        review the circumstances manually under this policy.
      </p>

      <h2>5. Non-Refundable Situations</h2>
      <p>We do not issue refunds for:</p>
      <ul>
        <li>sessions already completed and rated;</li>
        <li>
          disputes over subjective teaching quality (though we encourage reporting serious issues
          to our support team);
        </li>
        <li>credits earned through teaching (these follow the Payout Terms instead).</li>
      </ul>

      <h2>6. Teacher Payouts</h2>
      <p>
        Once a payout request has been marked "paid" by our team, it cannot be reversed. Payout
        requests still "pending" or "approved" (not yet paid) may be cancelled by the teacher by
        contacting support.
      </p>

      <h2>7. Contact</h2>
      <p>
        To request a refund or ask about this policy, contact us at{' '}
        <a href="mailto:support@skill-bridge.me">support@skill-bridge.me</a>.
      </p>
    </LegalLayout>
  );
}

export default RefundPolicyPage;
