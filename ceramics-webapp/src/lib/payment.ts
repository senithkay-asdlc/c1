// ceramics-webapp holds no payment-provider integration: it never calls a
// payment provider directly (that logic stays server-side in ceramics-api).
// The checkout contract still requires an opaque `paymentToken` string
// (normally minted by a payment provider's client-side SDK); here we derive
// a non-sensitive placeholder token from the card's last 4 digits so nothing
// resembling a full card number ever leaves the browser. ceramics-api is the
// sole authority on whether a charge is accepted or declined.
export function tokenizeCard(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, "");
  const last4 = digits.slice(-4) || "0000";
  return `tok_${last4}`;
}
