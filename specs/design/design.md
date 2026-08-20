# Ceramics Storefront — Design

## Overview

A single-seller online store for handmade ceramics. Shoppers browse a public catalog, manage a cart, and check out as a guest or signed in, paying by card with flat-rate shipping. The Store Admin, signed in via Thunder SSO, manages the catalog (including stock levels) and fulfills incoming orders. One `web-application` (`ceramics-webapp`) serves both roles with role-scoped screens; one `service` (`ceramics-api`) holds all business logic and data, backed by a database, Thunder for identity, and external payment and email providers.

## Context (C1)

```mermaid
graph TB
    shopper[Shopper]
    admin[Store Admin]
    system[Ceramics Storefront]
    thunder[Thunder SSO]
    payment[Payment Provider]
    email[Email Provider]

    shopper -->|browses, buys| system
    admin -->|manages catalog & orders| system
    system -->|sign-in / tokens| thunder
    system -->|charges card| payment
    system -->|sends order emails| email
```

## Domain model (ER)

```mermaid
erDiagram
    CUSTOMER {
        string id
        string email
        string thunderUserId
    }
    PRODUCT {
        string id
        string name
        string description
        decimal price
        int stockQty
        string category
        string status
    }
    CART {
        string id
        string customerId
        string createdAt
    }
    CART_ITEM {
        string cartId
        string productId
        int quantity
    }
    ORDER_ {
        string id
        string customerId
        string status
        decimal subtotal
        decimal shippingFee
        decimal total
        string createdAt
    }
    ORDER_ITEM {
        string orderId
        string productId
        int quantity
        decimal unitPrice
    }

    CUSTOMER ||--o{ CART : "owns (optional)"
    CUSTOMER ||--o{ ORDER_ : "places (optional)"
    CART ||--o{ CART_ITEM : contains
    PRODUCT ||--o{ CART_ITEM : "referenced by"
    ORDER_ ||--o{ ORDER_ITEM : contains
    PRODUCT ||--o{ ORDER_ITEM : "referenced by"
```

## Key flows

### Browse and add to cart

```mermaid
sequenceDiagram
    participant S as Shopper
    participant W as ceramics-webapp
    participant A as ceramics-api

    S->>W: Browse / search catalog
    W->>A: GET /products?search=&category=
    A-->>W: Product list (with stock)
    S->>W: Add product to cart
    W->>A: POST /carts/{cartId}/items
    A-->>W: Updated cart
```

### Checkout (guest or signed in)

```mermaid
sequenceDiagram
    participant S as Shopper
    participant W as ceramics-webapp
    participant A as ceramics-api
    participant P as Payment Provider
    participant E as Email Provider

    S->>W: Proceed to checkout, enter shipping + card details
    W->>A: POST /checkout {cartId, shippingAddress, paymentDetails, customerId?}
    A->>P: Charge card
    P-->>A: Payment result
    A->>A: Create order, decrement stock
    A->>E: Send order confirmation email
    A-->>W: Order confirmation
    W-->>S: Show order confirmation
```

### Admin manages catalog and fulfills orders

```mermaid
sequenceDiagram
    participant Adm as Store Admin
    participant W as ceramics-webapp
    participant A as ceramics-api

    Adm->>W: Sign in via Thunder
    Adm->>W: Create/edit product, set stock level
    W->>A: POST/PATCH /products
    A-->>W: Updated product (low-stock flag if applicable)
    Adm->>W: View incoming orders
    W->>A: GET /orders
    Adm->>W: Mark order fulfilled
    W->>A: POST /orders/{orderId}/fulfill
    A-->>W: Order marked shipped
```