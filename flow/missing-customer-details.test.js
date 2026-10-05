import { expect, test } from "vitest";
import main from "./missing-customer-details.js";

const order = (fields) => ({ order: { sourceName: "shopify_draft_order", email: null, phone: null, requiresShipping: true, shippingAddress: null, ...fields } });

test("draft order with nothing: all three missing", () => {
  expect(main(order({}))).toEqual({ hasMissing: true, missing: "customer email, phone number, shipping address", sourceName: "shopify_draft_order" });
});

test("draft order with email and an address that has a phone: passes", () => {
  expect(main(order({ email: "jane@example.com", shippingAddress: { address1: "1 Main St", phone: "+15555550100" } }))).toEqual({ hasMissing: false, missing: "", sourceName: "shopify_draft_order" });
});

test("draft order missing only the phone", () => {
  expect(main(order({ email: "jane@example.com", shippingAddress: { address1: "1 Main St", phone: null } }))).toEqual({ hasMissing: true, missing: "phone number", sourceName: "shopify_draft_order" });
});

test("storefront order is never touched", () => {
  expect(main(order({ sourceName: "web" }))).toEqual({ hasMissing: false, missing: "", sourceName: "web" });
});

test("nothing to ship: no address needed", () => {
  expect(main(order({ email: "jane@example.com", phone: "+15555550100", requiresShipping: false }))).toEqual({ hasMissing: false, missing: "", sourceName: "shopify_draft_order" });
});
