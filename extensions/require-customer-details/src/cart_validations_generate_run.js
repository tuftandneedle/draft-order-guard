// @ts-check

/**
 * @typedef {import("../generated/api").CartValidationsGenerateRunInput} CartValidationsGenerateRunInput
 * @typedef {import("../generated/api").CartValidationsGenerateRunResult} CartValidationsGenerateRunResult
 */

// Shopify doesn't tell a function that a cart is a draft order: staff completing a draft and a shopper clicking
// Pay now both arrive with CHECKOUT_COMPLETION. So the rule checks every order at completion and only skips the
// steps where details are missing by design. The storefront checkout must require the same details itself.
const SKIP_STEPS = ["CART_INTERACTION", "CHECKOUT_INTERACTION"];

// Delivery methods that don't need a shipping address.
const NO_ADDRESS_METHODS = ["PICK_UP", "PICKUP_POINT", "RETAIL", "NONE"];

const yesNo = (value) => (value ? "yes" : "no");

/**
 * @param {CartValidationsGenerateRunInput} input
 * @returns {CartValidationsGenerateRunResult}
 */
export function cartValidationsGenerateRun(input) {
  const step = input.buyerJourney.step;
  const { buyerIdentity, lines, deliveryGroups } = input.cart;
  const addresses = deliveryGroups.map((group) => group.deliveryAddress);

  const needsShipping = lines.some((line) => line.merchandise.requiresShipping);
  // A draft with no address can arrive with no delivery groups at all.
  const missingAddress =
    needsShipping &&
    (!deliveryGroups.length ||
      deliveryGroups.some(
        (group) =>
          !group.deliveryAddress?.address1 &&
          !NO_ADDRESS_METHODS.includes(group.selectedDeliveryOption?.deliveryMethodType ?? ""),
      ));

  const missing = [];
  if (!SKIP_STEPS.includes(step ?? "")) {
    if (!buyerIdentity?.email) missing.push("customer email");
    if (!buyerIdentity?.phone && !addresses.some((address) => address?.phone)) missing.push("phone number (customer or shipping address)");
    if (missingAddress) missing.push("shipping address");
  }
  const errors = missing.map((item) => ({
    message: `🛑 Missing ${item}. Click Cancel, add it, then try again.`,
    target: "$.cart",
  }));

  // Runs started in the admin don't show in the Dev Dashboard logs. To see what Shopify sends for a draft,
  // add a custom item named "debug" to it and click Collect payment. A storefront cart can't contain a custom item.
  if (lines.some((line) => line.merchandise.__typename === "CustomProduct" && line.merchandise.title === "debug")) {
    errors.push({
      message:
        `DEBUG step=${step} buyer=${yesNo(buyerIdentity)} email=${yesNo(buyerIdentity?.email)} phone=${yesNo(buyerIdentity?.phone)}` +
        ` customer=${yesNo(buyerIdentity?.customer)} loggedIn=${yesNo(buyerIdentity?.isAuthenticated)}` +
        ` groups=${deliveryGroups.length} address=${yesNo(addresses[0]?.address1)} addressPhone=${yesNo(addresses[0]?.phone)}` +
        ` shipping=${deliveryGroups[0]?.selectedDeliveryOption?.deliveryMethodType ?? "none"}`,
      target: "$.cart",
    });
  }

  return { operations: [{ validationAdd: { errors } }] };
}
