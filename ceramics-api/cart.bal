import ballerina/sql;

type CartMutationOutcome "ok"|"not_found"|"bad_request";

type CartMutationResult record {|
    CartMutationOutcome outcome;
    Cart? cart;
    string? message;
|};

function loadCart(string cartId) returns Cart?|error {
    CartRow|error cartRow = dbClient->queryRow(`SELECT id, customer_id AS customerId FROM carts WHERE id = ${cartId}`);
    if cartRow is error {
        if isNoRows(cartRow) {
            return ();
        }
        return cartRow;
    }
    stream<CartItemRow, sql:Error?> rows = dbClient->query(`
        SELECT ci.product_id AS productId, p.name AS name, p.price AS unitPrice, ci.quantity AS quantity
        FROM cart_items ci JOIN products p ON p.id = ci.product_id
        WHERE ci.cart_id = ${cartId}
        ORDER BY p.name
    `);
    CartItem[] items = [];
    check from CartItemRow row in rows
        do {
            items.push({productId: row.productId, name: row.name, unitPrice: row.unitPrice, quantity: row.quantity});
        };
    check rows.close();
    Cart cart = {id: cartRow.id, items};
    string? customerId = cartRow.customerId;
    if customerId is string {
        cart.customerId = customerId;
    }
    return cart;
}

function createCartImpl(string? customerId) returns Cart|error {
    string id = newId();
    _ = check dbClient->execute(`INSERT INTO carts (id, customer_id) VALUES (${id}, ${customerId})`);
    Cart? cart = check loadCart(id);
    if cart is () {
        return error("failed to load newly created cart");
    }
    return cart;
}

function addCartItemImpl(string cartId, CartItemInput input) returns CartMutationResult|error {
    CartRow|error cartRow = dbClient->queryRow(`SELECT id, customer_id AS customerId FROM carts WHERE id = ${cartId}`);
    if cartRow is error {
        if isNoRows(cartRow) {
            return {outcome: "not_found", cart: (), message: "cart not found"};
        }
        return cartRow;
    }
    ProductRow|error productRow = dbClient->queryRow(`
        SELECT id, name, description, price, category, stock_qty AS stockQty, images, status
        FROM products WHERE id = ${input.productId} AND status = 'active'
    `);
    if productRow is error {
        if isNoRows(productRow) {
            return {outcome: "not_found", cart: (), message: "product not found"};
        }
        return productRow;
    }

    record {|int quantity;|}|error existing = dbClient->queryRow(`
        SELECT quantity FROM cart_items WHERE cart_id = ${cartId} AND product_id = ${input.productId}
    `);
    int currentQuantity = 0;
    if existing is record {|int quantity;|} {
        currentQuantity = existing.quantity;
    } else if !isNoRows(existing) {
        return existing;
    }
    int newQuantity = currentQuantity + input.quantity;
    if newQuantity > productRow.stockQty {
        return {outcome: "bad_request", cart: (), message: "insufficient stock"};
    }

    if currentQuantity > 0 {
        _ = check dbClient->execute(`
            UPDATE cart_items SET quantity = ${newQuantity} WHERE cart_id = ${cartId} AND product_id = ${input.productId}
        `);
    } else {
        _ = check dbClient->execute(`
            INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (${cartId}, ${input.productId}, ${newQuantity})
        `);
    }
    Cart? cart = check loadCart(cartId);
    return {outcome: "ok", cart, message: ()};
}

function updateCartItemImpl(string cartId, string productId, CartItemInput input) returns CartMutationResult|error {
    record {|int quantity;|}|error existing = dbClient->queryRow(`
        SELECT quantity FROM cart_items WHERE cart_id = ${cartId} AND product_id = ${productId}
    `);
    if existing is error {
        if isNoRows(existing) {
            return {outcome: "not_found", cart: (), message: "cart item not found"};
        }
        return existing;
    }
    ProductRow|error productRow = dbClient->queryRow(`
        SELECT id, name, description, price, category, stock_qty AS stockQty, images, status
        FROM products WHERE id = ${productId}
    `);
    if productRow is error {
        if isNoRows(productRow) {
            return {outcome: "not_found", cart: (), message: "product not found"};
        }
        return productRow;
    }
    if input.quantity > productRow.stockQty {
        return {outcome: "bad_request", cart: (), message: "insufficient stock"};
    }
    _ = check dbClient->execute(`
        UPDATE cart_items SET quantity = ${input.quantity} WHERE cart_id = ${cartId} AND product_id = ${productId}
    `);
    Cart? cart = check loadCart(cartId);
    return {outcome: "ok", cart, message: ()};
}

function removeCartItemImpl(string cartId, string productId) returns boolean|error {
    sql:ExecutionResult result = check dbClient->execute(`
        DELETE FROM cart_items WHERE cart_id = ${cartId} AND product_id = ${productId}
    `);
    return wasRowAffected(result);
}
