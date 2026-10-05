import { expect, test } from "vitest";
import { missingDetails } from "../src/missing.js";

const ship = { nodes: [{ requiresShipping: true }] };

test("no customer on a draft that ships: all three missing", () => {
  expect(missingDetails({ email: null, phone: null, shippingAddress: null, lineItems: ship })).toEqual([
    "customer email",
    "phone number (customer or shipping address)",
    "shipping address",
  ]);
});

test("phone on the shipping address counts", () => {
  expect(missingDetails({ email: "jane@example.com", phone: null, shippingAddress: { address1: "1 Main St", phone: "+15555550100" }, lineItems: ship })).toEqual([]);
});

test("nothing to ship: no address needed", () => {
  expect(missingDetails({ email: "jane@example.com", phone: "+15555550100", shippingAddress: null, lineItems: { nodes: [{ requiresShipping: false }] } })).toEqual([]);
});
