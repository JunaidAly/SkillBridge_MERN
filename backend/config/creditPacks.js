// Maps our own internal pack slugs to what's actually sold - never trust a
// credits/price amount sent from the client, always resolve it from here.
// Purchase price (Rs. 5.00/credit) is intentionally different from
// CREDITS_TO_PKR_RATE in creditConversion.js (the teacher payout/cash-out
// rate, Rs. 4.00/credit) - the Rs. 1/credit gap is the platform's margin.
export const CREDIT_PACKS = {
  pack_100: { credits: 100, amountPKR: 500, displayPrice: 'Rs. 500', label: '100 Credits Pack' },
};

export const getPack = (packId) => CREDIT_PACKS[packId] || null;

export const listPackages = () =>
  Object.entries(CREDIT_PACKS).map(([packId, pack]) => ({ packId, ...pack }));
