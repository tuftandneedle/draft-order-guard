# Flow: flag orders created from drafts with missing customer details

Staff can click "Ignore and create order" in the checkout rule warning. This Shopify Flow workflow tags those orders and emails the team lead, so someone adds the missing details. It only looks at orders completed from a draft in the admin, never storefront orders.

It does not cancel the order. An order goes to order management within seconds of being created, so a cancel in Flow comes too late and leaves the two systems out of step.

## Build the workflow

1. In the store admin, open **Apps > Flow** and click **Create workflow**. Name it "Draft Order Guard: flag orders missing customer details".
2. Select the trigger **Order created**.
3. Add the action **Run code**. Fill in **Define inputs**, **Define outputs** and **Write code** as shown below.
4. After Run code, add a **Condition**: Run code > hasMissing is true.
5. On the true branch, add **Add order tags** with the tag `missing-customer-details`.
6. Then add **Send internal email** with the text below. Insert variables with **Add a variable** instead of typing them, and use the name Flow inserts.
7. Do the test run in the next section, then click **Turn on workflow**.

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

**Send internal email**

- To: the team lead for the store
- Subject: `Order {{order.name}} is missing customer details`
- Body:

```text
Order {{order.name}} was created from a draft order without: {{runCode.missing}}.
It is already with order management. Add the missing details to the order and tell order management.

Open the order: https://admin.shopify.com/store/STORE-HANDLE/orders/{{order.legacyResourceId}}
The order timeline shows which staff member created it.
```

Replace `STORE-HANDLE` with the part after `/store/` in the store's admin URL.

## Test it

The live tests create real orders that go to order management. Tell that team before you start.

- [ ] Test run first (safe). In the Flow editor, start a test run and pick an order created from a draft. A test run runs Run code but does not tag or email. Check `sourceName` in the Run code output. If it is not `shopify_draft_order`, add that value to `DRAFT_SOURCES` in the code.
- [ ] Turn the workflow on. Create a draft with no email and no phone, then click Collect payment, Mark as paid, Ignore and create order. Within a few minutes expect the tag `missing-customer-details` and the email. The order stays open.
- [ ] Draft with email, phone and shipping address: create the order. Expect no tag and no email.
- [ ] Order placed on the storefront: expect no tag and no email.

## Roll out

After the tests pass, export the workflow from Flow and import it into each store. Then change the email recipient and `STORE-HANDLE` in the email.

## Sources

- [Shopify Flow: Run code action](https://help.shopify.com/en/manual/shopify-flow/reference/actions/run-code)
- [Shopify Changelog: Flow test runs](https://changelog.shopify.com/posts/flow-preview-workflows-safely-with-test-runs)
- [Shopify Admin API: Order object](https://shopify.dev/docs/api/admin-graphql/latest/objects/Order)
