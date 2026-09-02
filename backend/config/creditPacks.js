// Maps Paddle Price IDs to the credit pack sold at that price.
// Never trust a credits/price amount sent from the client - always resolve it from here.
export const CREDIT_PACKS = {
  'pri_01m1fbbp3p8j7pxwbd9vzr5pdh': { credits: 100, displayPrice: '$5.00', label: '100 Credits Pack' },
};

export const getPackForPriceId = (priceId) => CREDIT_PACKS[priceId] || null;

export const getCreditsForPriceId = (priceId) => CREDIT_PACKS[priceId]?.credits || null;

export const listPackages = () =>
  Object.entries(CREDIT_PACKS).map(([priceId, pack]) => ({ priceId, ...pack }));
