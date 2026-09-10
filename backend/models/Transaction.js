import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Safepay's own reference for this payment (their tracker/payment id) -
    // only known once the webhook arrives, so not required at creation time.
    // The transaction's own _id (as a string) is what we hand Safepay as
    // `orderId` at checkout-creation time and match the webhook back against.
    // No `default` here on purpose - a sparse unique index only excludes
    // documents where the field is entirely absent, not ones where it's
    // explicitly `null`, so a `default: null` would defeat the index.
    providerTransactionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    // Safepay's tracker token, known immediately at checkout-creation time
    // (unlike providerTransactionId above). Used to actively poll Safepay's
    // Reporter API for the real payment status as a fallback when their
    // webhook can't reach us (e.g. localhost in dev has no public URL).
    safepayTrackerToken: {
      type: String,
      default: null,
    },
    packId: {
      type: String,
    },
    amountPaid: {
      type: Number,
    },
    currency: {
      type: String,
    },
    creditsGranted: {
      type: Number,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    rawPayload: {
      type: Object,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Transaction', transactionSchema);
