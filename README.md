# VORTEXIA STORE Multi-page website

## Included pages
- Home, Products, Product details, Cart, Checkout
- Customer Login, Register, My Orders
- Contact, FAQ, Terms
- Admin overview and separate Dashboard, Products, Orders, Payments, Customers, Delivery, Settings pages

## Project structure
```text
VORTEXIA-STORE/
├── index.html
├── products.html
├── product-details.html
├── cart.html
├── checkout.html
├── login.html
├── register.html
├── my-orders.html
├── contact.html
├── faq.html
├── terms.html
├── admin/
│   ├── index.html
│   ├── dashboard.html
│   ├── products.html
│   ├── orders.html
│   ├── payments.html
│   ├── customers.html
│   ├── delivery.html
│   └── settings.html
├── css/style.css
├── js/store.js
└── README.md
```

## GitHub Pages setup
1. Extract this ZIP.
2. Upload all extracted files and folders to the root of your GitHub repository.
3. Open **Settings → Pages**.
4. Select **Deploy from a branch**, `main`, and `/(root)`, then Save.
5. Use `https://YOUR-USERNAME.github.io/REPOSITORY-NAME/`.
6. To use `https://vortexiastore.top/`, set the custom domain in Settings → Pages and configure the DNS records GitHub displays. Then enable HTTPS.
7. Admin landing page: `https://vortexiastore.top/admin/` once the domain is connected.

## Important
This is a frontend-only prototype. GitHub Pages cannot run a secure backend or shared database:
- Login/register do not authenticate users.
- Checkout does not submit a real order.
- Cart is stored in the current browser only.
- Admin pages are layout/navigation placeholders, not functional CRUD pages.
- bKash/Nagad/Rocket payments are not accepted or verified.
- No email or digital product delivery occurs.

Do not accept real payments or store customer secrets in this public repository. Production use needs a secure backend/API, database, server-side authentication and a verified payment workflow. Product prices and availability are sample data and should be checked before publishing.
