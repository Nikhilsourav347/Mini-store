const { test, expect } = require('@playwright/test');
const path = require('path');
const { pathToFileURL } = require('url');

const pageUrl = pathToFileURL(path.join(__dirname, '..', 'index.html')).href;

// a fresh load each time, so no cart or name carries over between tests
test.beforeEach(async ({ page }) => {
  await page.goto(pageUrl);
});

const addToCart = (page, productName) =>
  page.getByRole('button', { name: `Add ${productName}` }).click();

test('changing a quantity updates the line total and the order total exactly', async ({ page }) => {
  await addToCart(page, 'Notebook');
  await page.getByRole('button', { name: 'Increase Notebook quantity' }).click();

  await expect(page.getByLabel('Quantity for Notebook')).toHaveValue('2');
  await expect(page.getByTestId('line-total-notebook')).toHaveText('$39.98');
  await expect(page.getByTestId('order-total')).toHaveText('$39.98');

  await addToCart(page, 'Pen Set');
  await expect(page.getByTestId('line-total-pen-set')).toHaveText('$4.50');
  await expect(page.getByTestId('order-total')).toHaveText('$44.48');
});

test('a missing name blocks checkout, shows the message and keeps the cart', async ({ page }) => {
  await addToCart(page, 'Notebook');
  await page.getByRole('button', { name: 'Place Order' }).click();

  const nameField = page.getByLabel('Full name');
  await expect(page.getByText('Full name is required.')).toBeVisible();
  await expect(nameField).toHaveAttribute('aria-invalid', 'true');
  await expect(nameField).toBeFocused();
  await expect(page.getByTestId('confirmation')).toBeHidden();

  await expect(page.getByTestId('cart-line-notebook')).toBeVisible();
  await expect(page.getByLabel('Quantity for Notebook')).toHaveValue('1');
  await expect(page.getByTestId('order-total')).toHaveText('$19.99');
});

test('an empty cart blocks checkout, shows the message and keeps the name', async ({ page }) => {
  await page.getByLabel('Full name').fill('Priya Sharma');
  await page.getByRole('button', { name: 'Place Order' }).click();

  await expect(page.getByText('Your cart is empty. Please add at least one item before placing an order.')).toBeVisible();
  await expect(page.getByTestId('confirmation')).toBeHidden();
  await expect(page.getByLabel('Full name')).toHaveValue('Priya Sharma');
});

test('a successful checkout shows a confirmation with a reference', async ({ page }) => {
  await addToCart(page, 'Notebook');
  await page.getByLabel('Full name').fill('Priya Sharma');
  await page.getByRole('button', { name: 'Place Order' }).click();

  await expect(page.getByRole('heading', { name: 'Order placed' })).toBeVisible();
  await expect(page.getByTestId('confirm-name')).toHaveText('Priya Sharma');
  await expect(page.getByTestId('confirm-items')).toHaveText('Notebook x 1');
  await expect(page.getByTestId('confirm-total')).toHaveText('$19.99');
  await expect(page.getByTestId('order-reference')).toHaveText(/^ORD-\d{4}-[A-Z0-9]{6}$/);
});

test('a double-click on Place Order gives exactly one confirmation', async ({ page }) => {
  await addToCart(page, 'Pen Set');
  await page.getByLabel('Full name').fill('Priya Sharma');
  await page.getByRole('button', { name: 'Place Order' }).dblclick();

  await expect(page.getByRole('heading', { name: 'Order placed' })).toHaveCount(1);
  await expect(page.getByText(/ORD-\d{4}-[A-Z0-9]{6}/)).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Place Order' })).toBeDisabled();
});
