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
    lineItems(first: 250) { nodes { requiresShipping } }
  }
}`;

function Extension() {
  // null while loading, an array of missing items, or "error".
  const [missing, setMissing] = useState(null);

  async function check() {
    setMissing(null);
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

  useEffect(() => {
    check();
  }, []);

  // The block cannot see edits made on the page, so staff re-run the check after adding details.
  const checkAgain = <s-button slot="secondary-actions" onClick={check}>Check again</s-button>;

  let banner;
  if (missing === null) {
    banner = <s-spinner />;
  } else if (missing === "error") {
    banner = (
      <s-banner tone="warning" heading="Could not check customer details">
        Check the customer, phone and shipping address by hand.
        {checkAgain}
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
        Add the missing details to this draft, then click Check again.
        {checkAgain}
      </s-banner>
    );
  } else {
    banner = (
      <s-banner tone="success" heading="Customer details complete">
        Email, phone and shipping address are on this draft.
        {checkAgain}
      </s-banner>
    );
  }

  return <s-admin-block heading="Customer details check">{banner}</s-admin-block>;
}
