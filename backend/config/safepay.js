import { Safepay } from '@sfpy/node-sdk';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Ensure env vars are loaded even if this module is imported before server.js calls dotenv.config()
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

// Safepay currently exposes two parallel systems and they do NOT interoperate
// (both confirmed live against the sandbox):
//
//   v1  - SDK payments.create() -> /order/v1/init. The hosted checkout page
//         (/checkout/pay?beacon=...) accepts these tokens and real payments
//         complete successfully. Payments 2.0's Reporter API (v2/v3) cannot
//         see them (returns 500 "get by ID failed").
//   v3  - /order/payments/v3/ ("Payments 2.0"). Reporter API sees these fine,
//         but the hosted checkout page rejects them client-side with
//         "Tracker is in an invalid state".
//
// So we stay on v1 (the flow that actually takes payments). Its own redirect
// only carries `order_id` + `tracker` - NOT a `sig` (confirmed live: a real
// completed payment's redirect had no sig param at all, so HMAC verification
// of the redirect itself isn't viable). The redirect's `tracker` is instead
// used to look up the real, authoritative status via GET /order/v1/{tracker}
// - a v1-namespaced status endpoint (distinct from the v2/v3 Reporter API
// above), confirmed live to return `state: 'TRACKER_ENDED'` plus a nested
// `transaction` object once a payment actually completes.
const safepay = new Safepay({
  environment: process.env.SAFEPAY_ENV || 'sandbox',
  apiKey: process.env.SAFEPAY_API_KEY,
  v1Secret: process.env.SAFEPAY_V1_SECRET,
  webhookSecret: process.env.SAFEPAY_WEBHOOK_SECRET,
});

export const SAFEPAY_API_BASE = process.env.SAFEPAY_ENV === 'production'
  ? 'https://api.getsafepay.com'
  : 'https://sandbox.api.getsafepay.com';

/**
 * Fetches a v1 tracker's real status. Returns the `data` object
 * ({ state, transaction, ... }) or null. `state === 'TRACKER_ENDED'` with a
 * `transaction` object present means the payment actually succeeded.
 */
export async function fetchV1TrackerStatus(trackerToken) {
  const res = await fetch(`${SAFEPAY_API_BASE}/order/v1/${trackerToken}`, {
    headers: { 'X-SFPY-MERCHANT-SECRET': process.env.SAFEPAY_WEBHOOK_SECRET },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Safepay v1 tracker lookup failed (HTTP ${res.status}): ${body.slice(0, 200)}`);
  }

  const json = await res.json();
  return json?.data || null;
}

export default safepay;
