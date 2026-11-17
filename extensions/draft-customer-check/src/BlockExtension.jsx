import "@shopify/ui-extensions/preact";
import { render } from "preact";
import { useEffect, useState } from "preact/hooks";
import { missingDetails } from "./missing.js";

export default async () => {
  render(<Extension />, document.body);
};

const QUERY = `query DraftCustomerCheck($id: ID!) {
  draftOrder(id: $id) {
    email
    phone
    shippingAddress { address1 phone }
    lineItems(first: 50) { nodes { requiresShipping } }
  }
}`;

function Extension() {
  // null while loading, an array of missing items, or "error".
  const [missing, setMissing] = useState(null);

  async function check() {
    try {
      const res = await fetch("shopify:admin/api/graphql.json", {
        method: "POST",
        body: JSON.stringify({ query: QUERY, variables: { id: shopify.data.selected[0].id } }),
      });
      const { data } = await res.json();
      setMissing(missingDetails(data.draftOrder));
    } catch (error) {
      console.error(error);
      setMissing("error");
    }
  }

  // Shopify doesn't tell a block when the draft changes, so re-check the saved draft every few seconds.
  // Polling: one small query per open draft every 5 s. Switch to a change event if Shopify adds one.
  useEffect(() => {
    check();
    const timer = setInterval(check, 5000);
    return () => clearInterval(timer);
  }, []);

  let banner;
  if (missing === null) {
    banner = <s-spinner />;
  } else if (missing === "error") {
    banner = (
      <s-banner tone="warning" heading="Could not check customer details">
        Check the customer, phone and shipping address by hand.
      </s-banner>
    );
  } else if (missing.length) {
    banner = (
      <s-banner tone="critical" heading="STOP: do not create this order yet">
        <s-unordered-list>
          {missing.map((item) => (
            <s-list-item key={item}>Missing {item}</s-list-item>
          ))}
        </s-unordered-list>
        Add the missing details and save the draft. This box updates within a few seconds.
      </s-banner>
    );
  } else {
    banner = (
      <s-banner tone="success" heading="Customer details complete">
        Email, phone and shipping address are on this draft.
      </s-banner>
    );
  }

  return <s-admin-block heading="Customer details check">{banner}</s-admin-block>;
}
