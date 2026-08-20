# Security Design

## Roles → permissions

## Authentication (Thunder)

- Shared dependency name: **`thunder-auth`**, declared on both `ceramics-webapp` (OIDC + PKCE login) and `ceramics-api` (token validation) — the same name ties browser sign-in to the bearer tokens the API validates.
- Scopes: `openid profile email` (default).
- Sign-in is OPTIONAL for Shoppers (guest checkout is fully supported) and REQUIRED for the Store Admin — the webapp routes an unauthenticated visitor to the storefront, never to the admin console.
- `ceramics-api` sits behind the gateway; the gateway validates the token and injects the caller's identity header. Public catalog/cart/guest-checkout endpoints accept unauthenticated calls; order-history and all admin endpoints require a valid token.

## Role resolution

- `ceramics-api` reads the caller's role from the validated token's claims (injected by the gateway). A token with no recognized role claim, or no token on a protected endpoint, is treated as unauthenticated/Shopper-only access.
- Admin-only endpoints (`/products` writes, `/orders` list/fulfill) deny by default: any caller not carrying the Store Admin role gets `403`.
- Order-history endpoints scope results to the caller's own `customerId` from the token — a Shopper can never read another shopper's orders.