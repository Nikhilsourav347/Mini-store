'use strict';

// Prices are integer cents so sums are exact. Only formatMoney turns them into text.
// Illustrations are inline SVG so the page still works offline from a double-click.
const NOTEBOOK_ART = `
  <svg viewBox="0 0 64 64" focusable="false">
    <rect x="17" y="10" width="32" height="44" rx="3" fill="#3b2f63"/>
    <rect x="17" y="10" width="6" height="44" rx="3" fill="#2a2147"/>
    <rect x="28" y="20" width="15" height="2.5" rx="1" fill="#c4b5fd"/>
    <rect x="28" y="26" width="10" height="2.5" rx="1" fill="#c4b5fd"/>
    <rect x="41" y="10" width="3.5" height="22" fill="#f472b6"/>
  </svg>`;
const PEN_SET_ART = `
  <svg viewBox="0 0 64 64" focusable="false">
    <g transform="rotate(45 32 32)">
      <rect x="28" y="8" width="8" height="38" rx="3" fill="#2563eb"/>
      <rect x="28" y="8" width="8" height="8" rx="3" fill="#1e3a8a"/>
      <path d="M28 46h8l-4 10z" fill="#1e3a8a"/>
    </g>
  </svg>`;

const PRODUCTS = [
  { id: 'notebook', name: 'Notebook', description: 'A5 hardcover, 200 pages', priceCents: 1999, art: NOTEBOOK_ART },
  { id: 'pen-set', name: 'Pen Set', description: 'Pack of 5 gel pens', priceCents: 450, art: PEN_SET_ART },
];
const MIN_QTY = 1;
const MAX_QTY = 99;
// No 0, 1, I or O, so a reference is easy to read out over the phone.
const REF_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

const cart = new Map(); // product id -> quantity
let ordered = false;

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
const findProduct = (id) => PRODUCTS.find((p) => p.id === id);
const clampQty = (n) => Math.min(MAX_QTY, Math.max(MIN_QTY, Math.trunc(n)));

function totalCents() {
  let sum = 0;
  for (const [id, qty] of cart) sum += findProduct(id).priceCents * qty;
  return sum;
}

function makeReference() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return 'ORD-' + Array.from(bytes, (b) => REF_CHARS[b % REF_CHARS.length]).join('');
}

function renderProducts() {
  for (const p of PRODUCTS) {
    const li = document.createElement('li');
    li.className = 'product';
    li.setAttribute('data-testid', `product-${p.id}`);
    li.innerHTML = `
      <div class="product-art art-${p.id}" aria-hidden="true">${p.art}</div>
      <div class="product-info">
        <h3></h3>
        <p class="desc"></p>
        <p class="price"></p>
        <button type="button" class="btn-add" data-add="${p.id}">Add ${p.name}</button>
      </div>`;
    li.querySelector('h3').textContent = p.name;
    li.querySelector('.desc').textContent = p.description;
    li.querySelector('.price').textContent = formatMoney(p.priceCents);
    productList.append(li);
  }
}

// Rebuilt only when items are added or removed, never while typing a quantity,
// so a half-typed number is not wiped.
function renderCart() {
  cartList.replaceChildren();
  for (const [id, qty] of cart) {
    const p = findProduct(id);
    const li = document.createElement('li');
    li.className = 'cart-line';
    li.setAttribute('data-testid', `cart-line-${id}`);
    li.innerHTML = `
      <div class="line-info">
        <h3></h3>
        <p></p>
      </div>
      <div class="qty">
        <label for="qty-${id}">Quantity<span class="sr-only"> for ${p.name}</span></label>
        <input id="qty-${id}" type="number" inputmode="numeric" min="${MIN_QTY}" max="${MAX_QTY}" step="1" value="${qty}" data-id="${id}">
      </div>
      <span class="line-total" id="line-total-${id}" data-testid="line-total-${id}"></span>
      <button type="button" class="btn-link" data-remove="${id}" aria-label="Remove ${p.name}">Remove</button>`;
    li.querySelector('h3').textContent = p.name;
    li.querySelector('p').textContent = `${formatMoney(p.priceCents)} each`;
    cartList.append(li);
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

function setNameError(show) {
  nameError.hidden = !show;
  if (show) nameInput.setAttribute('aria-invalid', 'true');
  else nameInput.removeAttribute('aria-invalid');
}

// Locks every control that could change the order once it has been placed.
function setLocked(locked) {
  const controls = document.querySelectorAll(
    '#products button, #cart-items button, #cart-items input, #checkout-form input, #checkout-form button'
  );
  controls.forEach((el) => { el.disabled = locked; });
}

productList.addEventListener('click', (e) => {
  const button = e.target.closest('[data-add]');
  if (!button || ordered) return;
  const id = button.dataset.add;
  cart.set(id, clampQty((cart.get(id) || 0) + 1));
  cartError.hidden = true;
  renderCart();
});

cartList.addEventListener('click', (e) => {
  const button = e.target.closest('[data-remove]');
  if (!button || ordered) return;
  cart.delete(button.dataset.remove);
  renderCart();
});

cartList.addEventListener('input', (e) => {
  const input = e.target;
  if (ordered || !input.matches('[data-id]')) return;
  // A blank or unreadable field keeps the last good quantity so the total never jumps to nonsense.
  if (input.value === '' || Number.isNaN(Number(input.value))) return;
  const qty = clampQty(Number(input.value));
  if (String(qty) !== input.value) input.value = qty;
  cart.set(input.dataset.id, qty);
  updateTotals();
});

// When the customer leaves the field, show the quantity the total is actually using.
cartList.addEventListener('change', (e) => {
  const input = e.target;
  if (input.matches('[data-id]')) input.value = cart.get(input.dataset.id);
});

nameInput.addEventListener('input', () => setNameError(false));

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (ordered) return;

  const name = nameInput.value.trim();
  const nameMissing = name === '';
  const cartMissing = cart.size === 0;
  setNameError(nameMissing);
  cartError.hidden = !cartMissing;

  if (nameMissing) { nameInput.focus(); return; }
  if (cartMissing) { productList.querySelector('[data-add]').focus(); return; }

  // Set before anything else. Events run one at a time, so a second click
  // always sees this flag and cannot create a second order.
  ordered = true;
  $('confirm-name').textContent = name;
  $('confirm-total').textContent = formatMoney(totalCents());
  $('confirm-ref').textContent = makeReference();
  setLocked(true);
  confirmation.hidden = false;
  confirmation.focus();
});

$('new-order').addEventListener('click', () => {
  ordered = false;
  cart.clear();
  form.reset();
  setNameError(false);
  cartError.hidden = true;
  confirmation.hidden = true;
  renderCart();
  setLocked(false);
  productList.querySelector('[data-add]').focus();
});

renderProducts();
renderCart();
