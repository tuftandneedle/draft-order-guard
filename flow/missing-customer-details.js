// Shopify Flow "Run code" step for the "Draft Order Guard: cancel orders missing customer details" workflow.
// Paste this whole file into Write code. Same rule as the app; keep the three copies in sync.

// Orders completed from a draft in the admin. Some stores report a numeric app ID instead:
// if a test run shows another sourceName for a draft order, add it here.
const DRAFT_SOURCES = ["shopify_draft_order"];

export default function main(input) {
  const order = input.order;
  const address = order.shippingAddress || {};
  const missing = [];

  if (DRAFT_SOURCES.includes(order.sourceName)) {
    if (!order.email) missing.push("customer email");
    if (!order.phone && !address.phone) missing.push("phone number");
    if (order.requiresShipping && !address.address1) missing.push("shipping address");
  }

  return { hasMissing: missing.length > 0, missing: missing.join(", "), sourceName: order.sourceName || "" };
}
