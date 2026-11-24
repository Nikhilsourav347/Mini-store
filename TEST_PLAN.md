# Test plan

Scope: the checkout page in `index.html` and `app.js`, tested in Chromium. No backend or payment is involved.

## Risks, highest first

1. Wrong totals. Customers see or pay the wrong amount.
2. Checkout allowed when it should be blocked (empty cart, blank name).
3. Duplicate orders from a double-click.
4. Lost input after an error (name or cart cleared).
5. Missing or unclear confirmation.
6. Odd quantities (blank, 0, negative, very large) giving nonsense totals.
7. Cart still editable after the order is placed.

## Test cases

| ID | Type | Risk | Steps | Expected result |
|----|------|------|-------|-----------------|
| TC-01 | Automated | 5 | Add a Notebook. Enter "Sam Rivera". Click Place Order. | One confirmation shows the name, total $19.99 and a reference like `ORD-7K3M9Q`. |
| TC-02 | Automated | 2, 4 | Add a Notebook. Leave the name blank. Click Place Order. | "Please enter your full name." appears, the field is marked invalid and has focus, no confirmation shows, the cart and $19.99 total remain. |
| TC-03 | Automated | 1 | Add a Notebook and a Pen Set. Set quantities to 3 and 2. | Line totals are $59.97 and $9.00. Order total is $68.97. |
| TC-04 | Automated | 3 | Add a Pen Set. Enter a name. Double-click Place Order. | Exactly one confirmation and one reference exist. |
| TC-05 | Manual | 2 | See "Manual test: empty cart". | Order is blocked with a clear message. |
| TC-06 | Manual | 3 | See "Manual test: rapid double-click". | Exactly one confirmation and one reference. |
| TC-07 | Manual | 6 | Add a Notebook. In the quantity box enter blank, 0, -5, 500 and 2.7, leaving the box after each. | Quantity ends at 1, 1, 1, 99 and 2. The total never shows a blank, negative or non-numeric amount. |
| TC-08 | Manual | 7 | Place a valid order. Try to add, remove, change a quantity and edit the name. | Every control is disabled. Only "Start a new order" works. |
| TC-09 | Manual | 3, 7 | After TC-08, click Start a new order. | Cart, name, total and confirmation are cleared. A new order can be placed with a new reference. |

## Manual test: empty cart (TC-05)

| Field | Entry |
|-------|-------|
| Steps | 1. Open `index.html`. 2. Type "Sam Rivera" in Full name. 3. Click Place Order without adding anything. |
| Expected | No confirmation. A red message says the cart is empty and asks for an item. The name is still filled in. Focus moves to the first "Add Notebook" button. |
| Actual | |
| Result | |
| Evidence file | |

## Manual test: rapid double-click (TC-06)

| Field | Entry |
|-------|-------|
| Steps | 1. Open `index.html`. 2. Add a Pen Set. 3. Type "Sam Rivera". 4. Click Place Order twice as fast as you can, or press Enter repeatedly in the name field. |
| Expected | One "Order placed" panel and one reference. The form is locked afterwards. |
| Actual | |
| Result | |
| Evidence file | |

## Defects

No defects have been logged. Add any real finding below.

| ID | Steps to reproduce | Expected | Actual | Evidence |
|----|--------------------|----------|--------|----------|
| | | | | |

## Automated run

Last run: 4 of 4 passed in Chromium (`npm test`).
