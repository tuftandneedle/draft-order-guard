// @ts-check

/**
 * @typedef {import("../generated/api").CartValidationsGenerateRunInput} CartValidationsGenerateRunInput
 * @typedef {import("../generated/api").CartValidationsGenerateRunResult} CartValidationsGenerateRunResult
 */

// The storefront cart and checkout run this function too. While the shopper is
// still in the cart or filling in checkout, details are missing by design, so
// only check at order completion (and when Shopify sends no step at all).
const SKIP_STEPS = ["CART_INTERACTION", "CHECKOUT_INTERACTION"];

/**
 * @param {CartValidationsGenerateRunInput} input
 * @returns {CartValidationsGenerateRunResult}
 */
export function cartValidationsGenerateRun(input) {
  const errors = [];

  if (!SKIP_STEPS.includes(input.buyerJourney.step ?? "")) {
    const { buyerIdentity, lines, deliveryGroups } = input.cart;
    const addresses = deliveryGroups.map((group) => group.deliveryAddress);
    const missing = [];
    if (!buyerIdentity?.email) missing.push("customer email");
    if (!buyerIdentity?.phone && !addresses.some((address) => address?.phone)) missing.push("phone number (customer or shipping address)");
    // A draft with no address can arrive with no delivery groups at all, so decide from the lines whether an address is needed.
    const needsShipping = lines.some((line) => line.merchandise.requiresShipping);
    if (needsShipping && (!addresses.length || addresses.some((address) => !address?.address1))) missing.push("shipping address");

    for (const item of missing) {
      errors.push({ message: `🛑 Missing ${item}. Click Cancel, add it, then try again.`, target: "$.cart" });
    }
  }

  return { operations: [{ validationAdd: { errors } }] };
}
