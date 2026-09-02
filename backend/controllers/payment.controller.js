import paddle from '../config/paddle.js';
import { getCreditsForPriceId, listPackages } from '../config/creditPacks.js';
import Transaction from '../models/Transaction.js';
import { CreditTransaction, CreditWallet } from '../models/Credit.js';

export const getPackages = async (req, res) => {
  res.json({ packages: listPackages() });
};

const VISIBLE_STATUSES = ['completed', 'failed', 'refunded'];
const MAX_PAGE_LIMIT = 50;
const DEFAULT_PAGE_LIMIT = 10;

export const getMyTransactions = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(MAX_PAGE_LIMIT, Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_PAGE_LIMIT));

    const filter = { user: req.user.userId, status: { $in: VISIBLE_STATUSES } };

    const [transactions, totalCount] = await Promise.all([
      Transaction.find(filter)
        .select('creditsGranted amountPaid currency status createdAt')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Transaction.countDocuments(filter),
    ]);

    res.json({
      transactions: transactions.map((t) => ({
        id: t._id.toString(),
        creditsGranted: t.creditsGranted,
        amountPaid: t.amountPaid,
        currency: t.currency,
        status: t.status,
        createdAt: t.createdAt,
      })),
      page,
      totalPages: Math.max(1, Math.ceil(totalCount / limit)),
      totalCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createCheckout = async (req, res) => {
  try {
    const { priceId } = req.body;

    if (!priceId) {
      return res.status(400).json({ message: 'priceId is required' });
    }

    const creditsGranted = getCreditsForPriceId(priceId);
    if (!creditsGranted) {
      return res.status(400).json({ message: 'Unknown priceId' });
    }

    const price = await paddle.prices.get(priceId, { include: ['product'] });

    res.json({
      success: true,
      price,
      customData: { userId: req.user.userId },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const handleWebhook = async (req, res) => {
  const signature = req.headers['paddle-signature'];
  const rawBody = req.body;

  let event;
  try {
    event = await paddle.webhooks.unmarshal(
      rawBody.toString(),
      process.env.PADDLE_WEBHOOK_SECRET,
      signature
    );
  } catch (error) {
    console.error('Paddle webhook signature verification failed:', error.message);
    return res.status(401).json({ message: 'Invalid signature' });
  }

  console.log(`Paddle webhook signature verified for event type: ${event.eventType}`);

  try {
    switch (event.eventType) {
      case 'transaction.completed': {
        const paddleTransactionId = event.data.id;

        const existing = await Transaction.findOne({ paddleTransactionId });
        if (existing && existing.status === 'completed') {
          return res.status(200).json({ received: true, message: 'Already processed' });
        }

        const userId = event.data.customData?.userId;
        const priceId = event.data.items?.[0]?.price?.id || null;
        const creditsGranted = getCreditsForPriceId(priceId);

        if (!userId || !creditsGranted) {
          console.error('Paddle webhook: missing userId or unresolved priceId', { userId, priceId });
          return res.status(200).json({ received: true, message: 'Missing userId or unknown priceId' });
        }

        const amountPaid = event.data.details?.totals?.grandTotal
          ? Number(event.data.details.totals.grandTotal) / 100
          : undefined;
        const currency = event.data.currencyCode;

        const transaction = existing
          ? await Transaction.findOneAndUpdate(
              { paddleTransactionId },
              {
                user: userId,
                priceId,
                amountPaid,
                currency,
                creditsGranted,
                status: 'completed',
                rawPayload: event.data,
              },
              { new: true }
            )
          : await Transaction.create({
              user: userId,
              paddleTransactionId,
              priceId,
              amountPaid,
              currency,
              creditsGranted,
              status: 'completed',
              rawPayload: event.data,
            });

        await CreditTransaction.create({
          user: userId,
          type: 'purchase',
          amount: creditsGranted,
          description: `Purchased ${creditsGranted} credits via Paddle`,
          source: 'paddle',
          transactionRef: transaction._id,
        });

        let wallet = await CreditWallet.findOne({ user: userId });
        if (!wallet) {
          wallet = await CreditWallet.create({
            user: userId,
            balance: creditsGranted,
            totalEarned: creditsGranted,
            totalSpent: 0,
          });
        } else {
          wallet.balance += creditsGranted;
          wallet.totalEarned += creditsGranted;
          await wallet.save();
        }

        return res.status(200).json({ received: true });
      }

      case 'transaction.payment_failed': {
        const paddleTransactionId = event.data.id;
        const userId = event.data.customData?.userId;
        const priceId = event.data.items?.[0]?.price?.id || null;

        console.error(`Paddle payment failed for transaction ${paddleTransactionId}`);

        await Transaction.findOneAndUpdate(
          { paddleTransactionId },
          {
            user: userId,
            paddleTransactionId,
            priceId,
            currency: event.data.currencyCode,
            status: 'failed',
            rawPayload: event.data,
          },
          { upsert: true, new: true }
        );

        return res.status(200).json({ received: true });
      }

      default:
        return res.status(200).json({ received: true, message: 'Event ignored' });
    }
  } catch (error) {
    console.error('Error processing Paddle webhook:', error);
    return res.status(200).json({ received: true, message: 'Processed with errors' });
  }
};
