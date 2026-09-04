// Student-facing sell rate: 1 credit = Rs. 5 (applied in Safepay credit-pack config, once built)
// Teacher payout rate: 1 credit = Rs. 4 (this file)
// Platform margin: Rs. 1/credit (~20%)
export const CREDITS_TO_PKR_RATE = 4;

export function creditsToRupees(credits) {
  return credits * CREDITS_TO_PKR_RATE;
}
