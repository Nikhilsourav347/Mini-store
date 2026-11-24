# Test plan

Scope: the checkout page (`index.html`, `app.js`) in Chromium. No backend or payment is involved.

## Risks, highest first

1. Wrong totals. Customers see the wrong amount.
2. Checkout allowed when it should be blocked (empty cart, blank name).
3. Duplicate orders from a double-click.
4. Lost input after an error (the name or the cart is cleared).
5. Missing or unclear confirmation.
6. Odd quantities (blank, 0, negative, very large) giving nonsense totals.
7. Cart still editable after the order is placed.

## Test cases

| ID | Type | Risk | Steps | Expected result |
|----|------|------|-------|-----------------|
| TC-01 | Automated | 1 | Add a Notebook. Click "Increase Notebook quantity". Add a Pen Set. | Notebook line total is $39.98, then Pen Set shows $4.50 and the order total is $44.48. |
| TC-02 | Automated | 2, 4 | Add a Notebook. Leave Full name blank. Click Place Order. | "Full name is required." appears, the field is marked invalid and has focus, no confirmation shows, the Notebook, quantity 1 and $19.99 total remain. |
| TC-03 | Automated | 2, 4 | Type "Priya Sharma". Click Place Order with an empty cart. | "Your cart is empty. Please add at least one item before placing an order." appears, no confirmation shows, the name is still filled in. |
| TC-04 | Automated | 5 | Add a Notebook. Enter "Priya Sharma". Click Place Order. | One confirmation shows the name, items, total $19.99 and a reference like `ORD-2026-7K3M9Q`. |
| TC-05 | Automated | 3 | Add a Pen Set. Enter a name. Double-click Place Order. | One confirmation and one reference exist. Place Order is disabled. |
| TC-06 | Manual | 2, 4 | See "Manual test: empty cart". | Order is blocked with a clear message and the name is kept. |
| TC-07 | Manual | 3 | See "Manual test: rapid double-click". | One confirmation and one reference. |
| TC-08 | Manual | 6 | Add a Notebook. In the quantity box enter 0, -5, 500 and 2.7, leaving the box after each. | Quantity ends at 1, 1, 99 and 2. The total never shows a blank, negative or non-numeric amount. |
| TC-09 | Manual | 7 | Place a valid order. Try the add, quantity, Remove and name controls. | Every one is disabled. Only "Start a new order" works. |

## Manual test results

Fill in Actual, Result and Evidence file from your own run. Nothing here has been run by hand yet.

### Empty cart (TC-06)

| Field | Entry |
|-------|-------|
| Steps | 1. Open `index.html`. 2. Type "Priya Sharma" in Full name. 3. Click Place Order without adding anything. |
| Expected | No confirmation. A red message reads "Your cart is empty. Please add at least one item before placing an order." The name is still filled in. Focus moves to the "Add Notebook" button. |
| Actual | |
| Result | |
| Evidence file | |

### Rapid double-click (TC-07)

| Field | Entry |
|-------|-------|
| Steps | 1. Open `index.html`. 2. Add a Pen Set. 3. Type "Priya Sharma". 4. Click Place Order twice as fast as you can. |
| Expected | One "Order placed" panel and one reference. Place Order and the other controls are disabled afterwards. |
| Actual | |
| Result | |
| Evidence file | |

## Defects

No defects have been logged. Add real findings only.

| ID | Steps to reproduce | Expected | Actual | Evidence |
|----|--------------------|----------|--------|----------|
| | | | | |

## Automated run

`npx playwright test`: 5 of 5 passed in Chromium.
