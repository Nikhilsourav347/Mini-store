# Mini Store checkout

A single-page checkout built with plain HTML, CSS and JavaScript. There are two sample products (Notebook $19.99, Pen Set $4.50), a cart with quantity controls, and an order form that needs a full name. There is no backend, payment or build step. Prices are kept in integer cents so totals are exact.

## Open the app

Double-click `index.html`. It runs straight from disk.

## Run the browser tests

You need Node.js. From the project folder:

```
npm install
npx playwright install chromium
npx playwright test
```

The tests open `index.html` from disk, so no server is needed. `npm test` does the same as `npx playwright test`.

## Open the report

```
npx playwright show-report
```

Screenshots and traces are saved for failed tests only.

## Files

- `index.html`: page markup and styles
- `app.js`: products, cart, validation and order logic
- `tests/checkout.spec.js`: Playwright tests
- `playwright.config.js`: Playwright settings (Chromium, HTML report)
- `package.json`: scripts and the one dev dependency, `@playwright/test`
- `TEST_PLAN.md`: risks, test cases and manual test sheets
