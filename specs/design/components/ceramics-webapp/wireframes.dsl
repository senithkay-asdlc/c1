// Ceramics Storefront — shopper + store admin wireframes

screen Catalog "Shopper browses and searches the handmade ceramics catalog"
  navbar "Ceramics Co. | Catalog -> Catalog | Cart -> Cart"
  row
    heading "Handmade Ceramics"
    right
    search "Search products…"
    select "Category: All"
  row
    card "Glazed Stoneware Mug | 24 | 12 in stock" -> ProductDetail
    card "Hand-thrown Vase | 58 | 3 in stock" -> ProductDetail
    card "Rustic Serving Bowl | 42 | Out of stock" -> ProductDetail
  row
    card "Speckled Dinner Plate | 30 | 20 in stock" -> ProductDetail
    card "Teapot with Bamboo Handle | 76 | 5 in stock" -> ProductDetail
    card "Ceramic Planter | 34 | 8 in stock" -> ProductDetail

screen ProductDetail "Shopper views one product's photos, price, and stock before buying"
  navbar "Ceramics Co. | Catalog -> Catalog | Cart -> Cart"
  breadcrumb "Catalog / Hand-thrown Vase"
  split 60/40
    left
      image "Hand-thrown Vase photo" 400x300
      text "A one-of-a-kind stoneware vase, wheel-thrown and finished with a matte celadon glaze."
    right
      heading "Hand-thrown Vase"
      text "$58.00"
      badge "3 in stock" success
      select "Quantity: 1"
      button "Add to cart" primary -> Cart

screen Cart "Shopper reviews and edits their cart before checkout"
  navbar "Ceramics Co. | Catalog -> Catalog | Cart -> Cart"
  heading "Your Cart"
  table "Product | Price | Qty | Subtotal"
    row "Hand-thrown Vase | $58.00 | 1 | $58.00"
    row "Glazed Stoneware Mug | $24.00 | 2 | $48.00"
  row
    right
    text "Subtotal: $106.00"
  row
    right
    button "Continue shopping"
    button "Proceed to checkout" primary -> Checkout

screen Checkout "Shopper pays by card and enters shipping details, as a guest or signed in"
  navbar "Ceramics Co. | Catalog -> Catalog | Cart -> Cart"
  breadcrumb "Cart / Checkout"
  heading "Checkout"
  text "Checking out as a guest — Sign in to save your order history"
  split 60/40
    left
      heading "Shipping address"
      input "Full name"
      input "Address line 1"
      input "City"
      row
        input "Postal code"
        input "Country"
      heading "Payment"
      input "Card number"
      row
        input "Expiry"
        input "CVC"
    right
      card "Order summary"
        text "Hand-thrown Vase x1 — $58.00"
        text "Glazed Stoneware Mug x2 — $48.00"
        text "Shipping — $6.00"
        text "Total — $112.00"
      button "Pay & place order" primary -> OrderConfirmation

screen OrderConfirmation "Shopper sees their order succeeded and what they bought"
  navbar "Ceramics Co. | Catalog -> Catalog | Cart -> Cart"
  heading "Order Confirmed"
  badge "Paid" success
  text "Order #10482 — a confirmation email is on its way."
  table "Product | Qty | Price"
    row "Hand-thrown Vase | 1 | $58.00"
    row "Glazed Stoneware Mug | 2 | $48.00"
  text "Total paid: $112.00"
  button "Back to catalog" primary -> Catalog

screen OrderHistory "A signed-in shopper checks on their past orders"
  navbar "Ceramics Co. | Catalog -> Catalog | Cart -> Cart | My Orders -> OrderHistory"
  heading "My Orders"
  table "Order | Date | Status | Total"
    row "#10482 | Aug 18 | Fulfilled | $112.00"
    row "#10465 | Aug 02 | Paid | $58.00"

screen AdminCatalog "Store Admin manages products and stock levels"
  navbar "Ceramics Co. Admin"
  sidebar "Catalog -> AdminCatalog | Orders -> AdminOrders"
  row
    heading "Catalog"
    right
    button "New product" primary -> AdminProductForm
  table "Product | Price | Stock | Status" -> AdminProductForm
    row "Hand-thrown Vase | $58.00 | 3 | Active"
    row "Rustic Serving Bowl | $42.00 | 0 | Active"
    row "Ceramic Planter | $34.00 | 2 | Active"
  badge "2 products low on stock" warning

screen AdminProductForm "Store Admin creates or edits a product, including its stock level"
  navbar "Ceramics Co. Admin"
  sidebar "Catalog -> AdminCatalog | Orders -> AdminOrders"
  breadcrumb "Catalog / Hand-thrown Vase"
  heading "Edit Product"
  input "Name — Hand-thrown Vase"
  textarea "Description"
  row
    input "Price — 58.00"
    input "Stock quantity — 3"
  select "Category: Vases"
  row
    right
    button "Retire product"
    button "Save" primary -> AdminCatalog

screen AdminOrders "Store Admin views incoming orders and marks them fulfilled"
  navbar "Ceramics Co. Admin"
  sidebar "Catalog -> AdminCatalog | Orders -> AdminOrders"
  heading "Orders"
  tabs "All | Paid | Fulfilled"
  table "Order | Customer | Total | Status | " 
    row "#10482 | guest | $112.00 | Fulfilled | Fulfilled"
    row "#10490 | j.chen@example.com | $58.00 | Paid | Mark fulfilled"
    row "#10491 | guest | $34.00 | Paid | Mark fulfilled"

flow "Shop and checkout"
  role "Shopper"
  description "A shopper browses the catalog, builds a cart, and checks out as a guest"
  Catalog
  ProductDetail
  Cart
  Checkout
  OrderConfirmation

flow "Check order history"
  role "Shopper"
  description "A signed-in shopper reviews their past orders"
  OrderHistory

flow "Manage catalog and orders"
  role "Store Admin"
  description "The store admin keeps the catalog current and fulfills incoming orders"
  AdminCatalog
  AdminProductForm
  AdminOrders
