# Mini Checkout

A single-page checkout for MiniStore, with two sample products (Notebook $19.99, Pen Set $4.50). It uses plain HTML, CSS and JavaScript. There is no backend, no payment and no build step. Prices are stored in integer cents.

## Run the app

Double-click `index.html`. It opens in your browser from the file system.

## Run the browser tests

You need Node.js. From this folder:

```
npm install
npx playwright install chromium
npm test
```

## Open the report

```
npm run report
```

This is the same as `npx playwright show-report`. Screenshots and traces are kept for failed tests only.

## Files

- `index.html`: page markup and styles
- `app.js`: cart, validation and order logic
- `tests/checkout.spec.js`: Playwright tests
- `TEST_PLAN.md`: risks, test cases and manual test sheets
