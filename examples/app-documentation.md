# MyStore E-commerce Application

## Overview
MyStore is an e-commerce platform for selling products online. The application runs at http://localhost:3000 during development.

## Key Features

### Product Browsing
Users can browse our product catalog at `/products`. The catalog supports:
- Search functionality
- Category filtering
- Product details at `/products/:id`

### Shopping Cart
Shopping cart is accessible at `/cart`. Users can:
- Add items to cart
- Update quantities
- Remove items
- Proceed to checkout

### Checkout Process
The checkout flow starts at `/checkout` and includes:
- Shipping information
- Payment details
- Order confirmation at `/order/confirmation`

### User Authentication
Users must create an account to make purchases:
- Login page: `/login`
- Signup page: `/signup`
- Password reset: `/forgot-password`

### User Account
Logged-in users can access their account at `/account` which includes:
- Order history at `/account/orders`
- Profile settings at `/account/profile`
- Saved addresses at `/account/addresses`

## Test Credentials

For testing purposes, use:
- Test user email: test@mystore.com
- Test user password: testpass123
- Admin email: admin@mystore.com
- Admin password: adminpass456

## Important Pages

Main navigation includes:
- Homepage: `/`
- About us: `/about`
- Contact: `/contact`
- FAQ: `/help/faq`
- Terms of service: `/legal/terms`

## Technical Notes

The application uses React on the frontend and Node.js on the backend. The search functionality is particularly important for user experience.

Note: All payment processing uses test mode in development.
