# Draft Order Guard

Shopify app for our stores. It stops staff from turning a draft order into a real order when customer details are missing:

- customer email
- phone number (on the customer or on the shipping address)
- shipping address (only when something ships)

The app has no server and nothing to host. Everything runs inside Shopify.

## What is in the repo

| Part | Folder | What it does |
| --- | --- | --- |
| Checkout rule | `extensions/require-customer-details` | Cart and Checkout Validation function. When staff click Collect payment on a draft with missing details, Shopify shows "Unresolved business rules" with one row per missing item. |
| Draft page banner | `extensions/draft-customer-check` | Admin block on the draft order page. Red banner listing what is missing, green when complete. It re-checks the saved draft every few seconds. |
| Flow code | `flow/` | Run code step for a Shopify Flow workflow that tags orders created from a draft with missing details and emails the team lead. Staff can still click "Ignore and create order", so this flags those orders. Setup steps: [flow/README.md](flow/README.md). |

## Set up

1. Install Node.js 22 or newer and the Shopify CLI: `npm install -g @shopify/cli`
2. Clone and install:

   ```sh
   git clone https://github.com/tuftandneedle/draft-order-guard.git
   cd draft-order-guard
   npm install
   ```

3. Run the tests: `npm test` (the first run builds the function and takes about 10 seconds).
4. Ask the app owner to add you to the "Draft Order Guard" app's organization in the Shopify Dev Dashboard.
5. Run `shopify app info`. It should show "Draft Order Guard" and your login.
6. After a change, run `npm test`, then `shopify app deploy`. Every deploy releases a new version to every store that has the app installed.

## Turn it on in a store

The app only works on Shopify Plus stores and development stores, because it contains a function.

1. Install the app on the store from the Dev Dashboard.
2. In the store admin, go to **Settings > Checkout > Checkout rules > Add rule > Require customer details** and turn it on.
3. Open a saved draft order. In **Blocks**, click **+ Block**, choose **Customer details check** and pin it.
4. Build the Flow workflow: [flow/README.md](flow/README.md).

## Before turning it on in production

- The storefront checkout runs the same rule at Pay now (see "The rule also runs in the storefront"). In **Settings > Checkout**, make sure customer contact requires an email and the shipping address phone is **Required**. Then place a guest order, a logged-in order and one with each express button on the store before you turn the rule on.
- If a shopper is ever blocked, turn the rule off in **Settings > Checkout > Checkout rules**. It takes effect at once.
- Any app or integration that completes draft orders through the API is blocked too, unless it passes `bypassCartValidations: true`. List those integrations for each store first.

## The rule also runs in the storefront

Shopify does not tell a function that a cart is a draft order. Staff completing a draft and a shopper clicking Pay now both arrive with the step `CHECKOUT_COMPLETION`, so the rule checks every order at that step. A shopper passes when the checkout itself requires an email, a phone number and a shipping address. Pickup orders need no shipping address.

## Troubleshooting: see what Shopify sends for a draft

Function runs started in the admin don't show in the Dev Dashboard logs. To see the input for a draft, add a custom item named `debug` to the draft and click **Collect payment > Mark as paid**. The warning shows an extra row starting with `DEBUG` that lists the step and which details arrived (yes/no only, no customer data). Click **Cancel**, then remove the item.

## Changing the rule

The rule lives in three places. Change all three, then run `npm test`:

- `extensions/require-customer-details/src/cart_validations_generate_run.js`
- `extensions/draft-customer-check/src/missing.js`
- `flow/missing-customer-details.js`
