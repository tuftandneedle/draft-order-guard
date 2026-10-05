# Flow: cancel orders created from drafts with missing customer details

Staff can click "Ignore and create order" in the checkout rule warning. This Shopify Flow workflow cancels those orders a few minutes after they are created, tags them and emails the team lead. It only touches orders completed from a draft in the admin, never storefront orders.

Before you turn it on, check with the order-management team that a cancelled order never reaches fulfillment.

## Build the workflow

1. In the store admin, open **Apps > Flow** and click **Create workflow**. Name it "Draft Order Guard: cancel orders missing customer details".
2. Select the trigger **Order created**.
3. Add the action **Run code**. Fill in **Define inputs**, **Define outputs** and **Write code** as shown below.
4. After Run code, add a **Condition**: Run code > hasMissing is true.
5. On the true branch, add **Add order tags** with the tag `missing-customer-details`.
6. Then add **Cancel order** with the settings below.
7. Then add **Send internal email** with the text below. Insert variables with **Add a variable** instead of typing them, and use the name Flow inserts.
8. Do the test run in the next section, then click **Turn on workflow**.

**Define inputs**

```graphql
{
  order {
    sourceName
    email
    phone
    requiresShipping
    shippingAddress {
      address1
      phone
    }
  }
}
```

**Define outputs**

```graphql
type Output {
  "True when the order came from a draft and is missing details"
  hasMissing: Boolean!
  "What is missing, separated by commas"
  missing: String!
  "Where the order came from, shown in test runs"
  sourceName: String!
}
```

**Write code:** paste the whole of [missing-customer-details.js](missing-customer-details.js).

**Cancel order**

- Reason: Staff error. Do not pick Fraudulent order: these orders are not fraud and must stay out of fraud reports.
- Refund: on. This returns any payment already taken.
- Restock items: on.
- Send a notification to the customer: off. Support recreates the order, so the customer should not get a cancellation email.
- Staff note: `Cancelled by Draft Order Guard: missing {{runCode.missing}}. Recreate the draft with full customer details.`

**Send internal email**

- To: the team lead for the store
- Subject: `Order {{order.name}} was cancelled: missing customer details`
- Body:

```text
Order {{order.name}} was created from a draft order without: {{runCode.missing}}.
Flow cancelled it. Recreate the draft with the missing details and take payment again.

Open the order: https://admin.shopify.com/store/STORE-HANDLE/orders/{{order.legacyResourceId}}
The order timeline shows which staff member created it.
```

Replace `STORE-HANDLE` with the part after `/store/` in the store's admin URL.

## Test it

The live tests create real orders. Tell the order-management team before you start.

- [ ] Test run first (safe). In the Flow editor, start a test run and pick an order created from a draft. A test run runs Run code but does not tag, cancel or email. Check `sourceName` in the Run code output. If it is not `shopify_draft_order`, add that value to `DRAFT_SOURCES` in the code.
- [ ] Turn the workflow on. Create a draft with no email and no phone, then click Collect payment, Mark as paid, Ignore and create order. Within a few minutes expect the tag `missing-customer-details`, the order cancelled with the staff note, and the email.
- [ ] Confirm with the order-management team that the cancelled test order never went to fulfillment.
- [ ] Draft with email, phone and shipping address: create the order. Expect no tag, no cancel and no email.
- [ ] Order placed on the storefront: expect no tag, no cancel and no email.

## Roll out

After the tests pass, export the workflow from Flow and import it into each store. Then change the email recipient and `STORE-HANDLE` in the email.

## Sources

- [Shopify Flow: Run code action](https://help.shopify.com/en/manual/shopify-flow/reference/actions/run-code)
- [Shopify Flow: Cancel order action](https://help.shopify.com/en/manual/shopify-flow/reference/actions/cancel-order)
- [Shopify Changelog: Flow test runs](https://changelog.shopify.com/posts/flow-preview-workflows-safely-with-test-runs)
- [Shopify Admin API: Order object](https://shopify.dev/docs/api/admin-graphql/latest/objects/Order)
