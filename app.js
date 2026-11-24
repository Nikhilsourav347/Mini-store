'use strict';

// prices are whole cents, so sums stay exact. they only become text in formatMoney
const PRODUCTS = [
  {
    id: 'notebook',
    name: 'Notebook',
    description: 'A5 hardcover, 200 pages',
    priceCents: 1999,
    art: `<svg viewBox="0 0 64 64" focusable="false">
      <rect x="17" y="10" width="32" height="44" rx="3" fill="#3b2f63"/>
      <rect x="17" y="10" width="6" height="44" rx="3" fill="#2a2147"/>
      <rect x="28" y="20" width="15" height="2.5" rx="1" fill="#c4b5fd"/>
      <rect x="28" y="26" width="10" height="2.5" rx="1" fill="#c4b5fd"/>
      <rect x="41" y="10" width="3.5" height="22" fill="#f472b6"/>
    </svg>`,
  },
  {
    id: 'pen-set',
    name: 'Pen Set',
    description: 'Pack of 5 gel pens',
    priceCents: 450,
    art: `<svg viewBox="0 0 64 64" focusable="false">
      <g transform="rotate(45 32 32)">
        <rect x="28" y="8" width="8" height="38" rx="3" fill="#2563eb"/>
        <rect x="28" y="8" width="8" height="8" rx="3" fill="#1e3a8a"/>
        <path d="M28 46h8l-4 10z" fill="#1e3a8a"/>
      </g>
    </svg>`,
  },
];

const MIN_QTY = 1;
const MAX_QTY = 99;
// no 0, 1, I or O, so a reference is easy to read out loud
const REF_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

const cart = new Map(); // product id -> quantity
let orderSubmitted = false;

const $ = (id) => document.getElementById(id);
const productList = $('products');
const cartList = $('cart-items');
const cartEmpty = $('cart-empty');
const cartError = $('cart-error');
const orderTotal = $('order-total');
const form = $('checkout-form');
const nameInput = $('full-name');
const nameError = $('name-error');
const confirmation = $('confirmation');

const formatMoney = (cents) => currency.format(cents / 100);
const findProduct = (id) => PRODUCTS.find((product) => product.id === id);
const clampQty = (n) => Math.min(MAX_QTY, Math.max(MIN_QTY, Math.trunc(n)));
const focusFirstAddButton = () => productList.querySelector('[data-add]').focus();

function totalCents() {
  let sum = 0;
  for (const [id, qty] of cart) sum += findProduct(id).priceCents * qty;
  return sum;
}

function makeReference() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  const code = Array.from(bytes, (b) => REF_CHARS[b % REF_CHARS.length]).join('');
  return `ORD-${new Date().getFullYear()}-${code}`;
}

function renderProducts() {
  for (const product of PRODUCTS) {
    const item = document.createElement('li');
    item.className = 'product';
    item.setAttribute('data-testid', `product-${product.id}`);
    item.innerHTML = `
      <div class="product-art art-${product.id}" aria-hidden="true">${product.art}</div>
      <div class="product-info">
        <h3></h3>
        <p class="desc"></p>
        <p class="price"></p>
        <button type="button" class="btn-add" data-add="${product.id}"></button>
      </div>`;
    item.querySelector('h3').textContent = product.name;
    item.querySelector('.desc').textContent = product.description;
    item.querySelector('.price').textContent = formatMoney(product.priceCents);
    item.querySelector('button').textContent = `Add ${product.name}`;
    productList.append(item);
  }
}

// only runs when an item is added or removed. quantity changes update the
// existing row, so a number the customer is half way through typing is not wiped
function renderCart() {
  cartList.replaceChildren();
  for (const [id, qty] of cart) {
    const product = findProduct(id);
    const item = document.createElement('li');
    item.className = 'cart-line';
    item.setAttribute('data-testid', `cart-line-${id}`);
    item.innerHTML = `
      <div class="line-info">
        <h3></h3>
        <p></p>
      </div>
      <div class="stepper">
        <button type="button" class="btn-step" data-step="-1" data-id="${id}"></button>
        <label class="sr-only" for="qty-${id}"></label>
        <input id="qty-${id}" type="number" min="${MIN_QTY}" max="${MAX_QTY}" value="${qty}" data-id="${id}">
        <button type="button" class="btn-step" data-step="1" data-id="${id}"></button>
      </div>
      <span class="line-total" id="line-total-${id}" data-testid="line-total-${id}"></span>
      <button type="button" class="btn-link" data-remove="${id}">Remove</button>`;
    item.querySelector('h3').textContent = product.name;
    item.querySelector('p').textContent = `${formatMoney(product.priceCents)} each`;
    item.querySelector('label').textContent = `Quantity for ${product.name}`;

    const [decrease, increase] = item.querySelectorAll('.btn-step');
    decrease.textContent = '-';
    decrease.setAttribute('aria-label', `Decrease ${product.name} quantity`);
    increase.textContent = '+';
    increase.setAttribute('aria-label', `Increase ${product.name} quantity`);
    item.querySelector('[data-remove]').setAttribute('aria-label', `Remove ${product.name}`);

    cartList.append(item);
  }
  cartEmpty.hidden = cart.size > 0;
  updateTotals();
}

function updateTotals() {
  for (const [id, qty] of cart) {
    $(`line-total-${id}`).textContent = formatMoney(findProduct(id).priceCents * qty);
  }
  orderTotal.textContent = formatMoney(totalCents());
}

function setQuantity(id, qty) {
  cart.set(id, qty);
  const input = $(`qty-${id}`);
  if (input.value !== String(qty)) input.value = qty;
  updateTotals();
}

function setNameError(show) {
  nameError.hidden = !show;
  if (show) nameInput.setAttribute('aria-invalid', 'true');
  else nameInput.removeAttribute('aria-invalid');
}

function setLocked(locked) {
  const controls = document.querySelectorAll(
    '#products button, #cart-items button, #cart-items input, #checkout-form input, #checkout-form button'
  );
  controls.forEach((control) => { control.disabled = locked; });
}

productList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-add]');
  if (!button || orderSubmitted) return;
  const id = button.dataset.add;
  cart.set(id, clampQty((cart.get(id) || 0) + 1));
  cartError.hidden = true;
  renderCart();
});

cartList.addEventListener('click', (event) => {
  if (orderSubmitted) return;

  const stepButton = event.target.closest('[data-step]');
  if (stepButton) {
    const id = stepButton.dataset.id;
    setQuantity(id, clampQty(cart.get(id) + Number(stepButton.dataset.step)));
    return;
  }

  const removeButton = event.target.closest('[data-remove]');
  if (removeButton) {
    cart.delete(removeButton.dataset.remove);
    renderCart();
    // the clicked button is gone, so hand focus on instead of dropping it
    const nextButton = cartList.querySelector('[data-remove]');
    if (nextButton) nextButton.focus();
    else focusFirstAddButton();
  }
});

cartList.addEventListener('input', (event) => {
  const input = event.target;
  if (orderSubmitted || !input.matches('input[data-id]')) return;
  // a blank field keeps the last good quantity, so the total never shows nonsense
  if (input.value === '') return;
  setQuantity(input.dataset.id, clampQty(Number(input.value)));
});

// on leaving the field, show the quantity the total is really using
cartList.addEventListener('change', (event) => {
  const input = event.target;
  if (input.matches('input[data-id]')) input.value = cart.get(input.dataset.id);
});

nameInput.addEventListener('input', () => setNameError(false));

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (orderSubmitted) return;

  const name = nameInput.value.trim();
  const nameMissing = name === '';
  const cartMissing = cart.size === 0;
  setNameError(nameMissing);
  cartError.hidden = !cartMissing;

  if (nameMissing) {
    nameInput.focus();
    return;
  }
  if (cartMissing) {
    focusFirstAddButton();
    return;
  }

  // set first. events run one at a time, so a second click always sees
  // this flag and stops before it can make a second confirmation
  orderSubmitted = true;
  setLocked(true);

  $('confirm-name').textContent = name;
  $('confirm-items').textContent = Array.from(cart, ([id, qty]) => `${findProduct(id).name} x ${qty}`).join(', ');
  $('confirm-total').textContent = formatMoney(totalCents());
  $('confirm-ref').textContent = makeReference();
  confirmation.hidden = false;
  confirmation.focus();
});

$('new-order').addEventListener('click', () => {
  orderSubmitted = false;
  cart.clear();
  form.reset();
  setNameError(false);
  cartError.hidden = true;
  confirmation.hidden = true;
  renderCart();
  setLocked(false);
  focusFirstAddButton();
});

renderProducts();
renderCart();
