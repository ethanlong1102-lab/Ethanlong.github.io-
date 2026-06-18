# E&B Studios Website

Static website for E&B Studios.

## Pages

- `index.html` - main landing page
- `pricing.html` - pricing and package selection
- `checkout.html` - package review / payment placeholder page

## Local Preview

Open `index.html` directly in a browser, or run a simple local server from this folder:

```bash
python3 -m http.server 4321
```

Then visit:

```text
http://127.0.0.1:4321/
```

## GitHub Pages

1. Create a new GitHub repository.
2. Upload these files to the repository root:
   - `index.html`
   - `pricing.html`
   - `checkout.html`
   - `styles.css`
   - `script.js`
   - `README.md`
   - `.gitignore`
   - `.nojekyll`
3. In GitHub, go to `Settings` -> `Pages`.
4. Set source to `Deploy from a branch`.
5. Choose the `main` branch and `/root`.
6. Save.

GitHub will publish the site at a `github.io` URL.

## Payment Note

The checkout page is a front-end placeholder. To actually collect payments, connect the `Continue to Payment` button to Stripe Checkout, Square, PayPal, or another payment provider.
