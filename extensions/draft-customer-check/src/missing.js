// Same rule as the require-customer-details function. Keep the two in sync.
export function missingDetails(draft) {
  const missing = [];
  if (!draft.email) missing.push("customer email");
  if (!draft.phone && !draft.shippingAddress?.phone) missing.push("phone number (customer or shipping address)");
  if (draft.lineItems.nodes.some((line) => line.requiresShipping) && !draft.shippingAddress?.address1) missing.push("shipping address");
  return missing;
}
