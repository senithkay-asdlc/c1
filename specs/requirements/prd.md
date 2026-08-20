# Ceramics Storefront — PRD

## Problem Statement

Independent makers of handmade ceramics have no simple way to sell their work online. Selling through generic marketplaces buries unique, handmade pieces among mass-produced goods and takes a cut of every sale, while building a custom storefront is out of reach without engineering help. Buyers who want to browse and purchase handmade ceramics are left piecing together information across social media and marketplace listings with no dedicated place to browse a curated catalog, manage a cart, and check out.

## Solution

A single-seller online store dedicated to handmade ceramics: shoppers browse a product catalog, add pieces to a cart, and check out with a card payment and flat-rate shipping — as a guest or with an optional account for order history. The store's admin manages the product catalog, tracks stock, and fulfills orders from one place.

## Actors

- **Shopper** — browses the product catalog, manages a cart, checks out (as a guest or signed in), and, if signed in, views their own order history.
- **Store Admin** — signs in to manage the product catalog (create, edit, retire products and stock levels) and to view and fulfill incoming orders.

## User Stories

1. As a Shopper, I want to browse the product catalog, so that I can see what handmade ceramics are available.
2. As a Shopper, I want to view a single product's details (photos, description, price, stock availability), so that I can decide whether to buy it.
3. As a Shopper, I want to search and filter the catalog (e.g. by category or price), so that I can find pieces I'm interested in faster.
4. As a Shopper, I want to add a product to my cart and adjust quantities, so that I can collect items before buying.
5. As a Shopper, I want to view and edit my cart before checkout, so that I can confirm what I'm about to buy.
6. As a Shopper, I want to check out as a guest without creating an account, so that I can buy quickly without friction.
7. As a Shopper, I want to sign in via SSO, so that I can view my past orders later.
8. As a Shopper, I want to pay by card at checkout, so that I can complete my purchase securely.
9. As a Shopper, I want to see a flat shipping fee (or free shipping when it applies) at checkout, so that I know the full cost before I pay.
10. As a Shopper, I want to receive an order confirmation after checkout, so that I know my purchase succeeded and what I bought.
11. As a signed-in Shopper, I want to view my order history, so that I can check on past purchases.
12. As a Store Admin, I want to sign in via SSO, so that only I can manage the store.
13. As a Store Admin, I want to create, edit, and retire products in the catalog (including price, description, photos, and stock level), so that the catalog reflects what I actually have to sell.
14. As a Store Admin, I want to be warned when a product's stock runs low or out, so that I don't oversell a one-of-a-kind piece.
15. As a Store Admin, I want to view incoming orders and mark them as fulfilled/shipped, so that I can manage order processing end to end.

## Product Decisions

- Single-seller storefront: one store, one catalog, one admin role — not a multi-vendor marketplace.
- Sign-in is via Thunder, the platform SSO, for both the Store Admin (required) and Shoppers (optional, only needed for order history).
- Guest checkout is allowed; creating an account is never required to buy.
- Checkout supports card payment only, via a standard payment processing provider (concrete provider selected at design time).
- Shipping is flat-rate or free, set by the admin — no live carrier rate lookup or generated tracking numbers.
- *assumed* Order confirmation and fulfillment updates are sent to the shopper by email.

## Out of Scope

- Multi-vendor marketplace features (multiple independent sellers, onboarding, payout splitting).
- Real-time shipping carrier integration, live rate shopping, and tracking-number generation.
- Alternative payment methods beyond card (PayPal, wallets, buy-now-pay-later).
- Product reviews/ratings and personalized recommendations.
- Returns/refunds workflow automation.
- Inventory forecasting or demand planning.

## Open Questions

1. Returns and refunds policy and workflow are not defined — deferred; does not block design. The admin can be given a manual path (e.g. cancel/refund an order) if needed, but the policy itself is a business decision for later.

## Further Notes

None.