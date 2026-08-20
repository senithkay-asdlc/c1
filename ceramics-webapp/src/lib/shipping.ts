// Client-side estimate shown before payment submission so the shopper sees
// the shipping fee up front. ceramics-api computes the authoritative
// shippingFee/total on the created Order — this is a display estimate only.
export const FLAT_SHIPPING_FEE = 6.0;
export const FREE_SHIPPING_THRESHOLD = 150.0;

export function estimateShippingFee(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_FEE;
}
