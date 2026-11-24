const { test, expect } = require('@playwright/test');
const path = require('path');
const { pathToFileURL } = require('url');

const pageUrl = pathToFileURL(path.join(__dirname, '..', 'index.html')).href;

// A fresh load for every test, so no cart or name leaks between them.
test.beforeEach(async ({ page }) => {
  await page.goto(pageUrl);
});

const addToCart = (page, productName) =>
  page.getByRole('button', { name: `Add ${productName}` }).click();

test('a successful checkout shows a confirmation with a reference', async ({ page }) => {
  await addToCart(page, 'Notebook');
  await page.getByLabel('Full name').fill('Sam Rivera');
  await page.getByRole('button', { name: 'Place Order' }).click();

  await expect(page.getByRole('heading', { name: 'Order placed' })).toBeVisible();
  await expect(page.getByTestId('confirm-name')).toHaveText('Sam Rivera');
  await expect(page.getByTestId('confirm-total')).toHaveText('$19.99');
  await expect(page.getByTestId('order-reference')).toHaveText(/^ORD-[A-Z0-9]{6}$/);
});

test('a missing name blocks checkout, shows the message and keeps the cart', async ({ page }) => {
  await addToCart(page, 'Notebook');
  await page.getByRole('button', { name: 'Place Order' }).click();

  const nameField = page.getByLabel('Full name');
  await expect(page.getByText('Please enter your full name.')).toBeVisible();
  await expect(nameField).toHaveAttribute('aria-invalid', 'true');
  await expect(nameField).toBeFocused();
  await expect(page.getByTestId('confirmation')).toBeHidden();

  await expect(page.getByTestId('cart-line-notebook')).toBeVisible();
  await expect(page.getByLabel('Quantity for Notebook')).toHaveValue('1');
  await expect(page.getByTestId('order-total')).toHaveText('$19.99');
});

test('changing a quantity updates line totals and the order total exactly', async ({ page }) => {
  await addToCart(page, 'Notebook');
  await addToCart(page, 'Pen Set');

  await page.getByLabel('Quantity for Notebook').fill('3');
  await page.getByLabel('Quantity for Pen Set').fill('2');

  await expect(page.getByTestId('line-total-notebook')).toHaveText('$59.97');
  await expect(page.getByTestId('line-total-pen-set')).toHaveText('$9.00');
  await expect(page.getByTestId('order-total')).toHaveText('$68.97');
});

test('a double-click on Place Order gives exactly one confirmation', async ({ page }) => {
  await addToCart(page, 'Pen Set');
  await page.getByLabel('Full name').fill('Sam Rivera');
  await page.getByRole('button', { name: 'Place Order' }).dblclick();

  await expect(page.getByRole('heading', { name: 'Order placed' })).toHaveCount(1);
  await expect(page.getByText(/ORD-[A-Z0-9]{6}/)).toHaveCount(1);
});
