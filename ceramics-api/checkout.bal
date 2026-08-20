import ballerina/log;
import ballerina/sql;
import ballerina/time;

type CheckoutOutcome "created"|"bad_request"|"payment_required"|"not_found";

type CheckoutResult record {|
    CheckoutOutcome outcome;
    Order? 'order;
    string? message;
|};

type InsufficientStockError distinct error;

function reserveStock(string productId, int quantity) returns error? {
    sql:ExecutionResult decrementResult = check dbClient->execute(`
        UPDATE products SET stock_qty = stock_qty - ${quantity}
        WHERE id = ${productId} AND stock_qty >= ${quantity}
    `);
    if !wasRowAffected(decrementResult) {
        return error InsufficientStockError("insufficient stock for product " + productId);
    }
}

function insertOrderRows(string orderId, string? customerId, decimal subtotal, decimal shippingFee, decimal total,
        Address shippingAddress, string? email, CartItem[] items) returns error? {
    string? line2 = shippingAddress?.line2;
    _ = check dbClient->execute(`
        INSERT INTO orders (id, customer_id, status, subtotal, shipping_fee, total,
            shipping_line1, shipping_line2, shipping_city, shipping_postal_code, shipping_country, email)
        VALUES (${orderId}, ${customerId}, 'paid', ${subtotal}, ${shippingFee}, ${total},
            ${shippingAddress.line1}, ${line2}, ${shippingAddress.city}, ${shippingAddress.postalCode},
            ${shippingAddress.country}, ${email})
    `);
    foreach CartItem item in items {
        string itemName = item?.name ?: "";
        decimal itemPrice = item?.unitPrice ?: 0d;
        _ = check dbClient->execute(`
            INSERT INTO order_items (order_id, product_id, name, quantity, unit_price)
            VALUES (${orderId}, ${item.productId}, ${itemName}, ${item.quantity}, ${itemPrice})
        `);
    }
}

function checkoutImpl(CheckoutRequest payload, string? callerUserId) returns CheckoutResult|error {
    Cart? cart = check loadCart(payload.cartId);
    if cart is () {
        return {outcome: "not_found", 'order: (), message: "cart not found"};
    }
    if cart.items.length() == 0 {
        return {outcome: "bad_request", 'order: (), message: "cart is empty"};
    }

    decimal subtotal = 0d;
    foreach CartItem item in cart.items {
        ProductRow|error productRow = dbClient->queryRow(`
            SELECT id, name, description, price, category, stock_qty AS stockQty, images, status
            FROM products WHERE id = ${item.productId}
        `);
        if productRow is error {
            if isNoRows(productRow) {
                return {outcome: "bad_request", 'order: (), message: "product no longer available"};
            }
            return productRow;
        }
        if productRow.status == "retired" || item.quantity > productRow.stockQty {
            return {outcome: "bad_request", 'order: (), message: "insufficient stock for " + item.productId};
        }
        decimal unitPrice = item?.unitPrice ?: 0d;
        subtotal += unitPrice * <decimal>item.quantity;
    }

    decimal shippingFee = subtotal >= freeShippingThreshold ? 0d : flatShippingFee;
    decimal total = subtotal + shippingFee;

    ChargeResult chargeResult = check chargeCard(total, "usd", payload.paymentDetails.paymentToken);
    if !chargeResult.success {
        return {
            outcome: "payment_required",
            'order: (),
            message: chargeResult?.declineMessage ?: "payment declined"
        };
    }

    string orderId = newId();
    string? emailForOrder = payload?.email;

    error? transactionError = ();
    transaction {
        foreach CartItem item in cart.items {
            check reserveStock(item.productId, item.quantity);
        }
        check insertOrderRows(orderId, callerUserId, subtotal, shippingFee, total, payload.shippingAddress,
                emailForOrder, cart.items);
        _ = check dbClient->execute(`DELETE FROM carts WHERE id = ${payload.cartId}`);
        check commit;
    } on fail error e {
        transactionError = e;
    }

    if transactionError is error {
        string chargeId = chargeResult?.chargeId ?: "";
        if chargeId != "" {
            error? refundResult = refundCharge(chargeId);
            if refundResult is error {
                log:printError("failed to refund after stock reservation failure", 'error = refundResult,
                        orderId = orderId);
            }
        }
        return {outcome: "bad_request", 'order: (), message: "insufficient stock"};
    }

    OrderItem[] orderItems = [];
    foreach CartItem item in cart.items {
        orderItems.push({
            productId: item.productId,
            name: item?.name ?: "",
            quantity: item.quantity,
            unitPrice: item?.unitPrice ?: 0d
        });
    }
    Order 'order = {
        id: orderId,
        status: "paid",
        items: orderItems,
        subtotal,
        shippingFee,
        total,
        shippingAddress: payload.shippingAddress,
        createdAt: time:utcToString(time:utcNow())
    };
    if callerUserId is string {
        'order.customerId = callerUserId;
    }

    if emailForOrder is string {
        string body = string `Thank you for your order ${orderId}. Total charged: ${total} USD. ` +
            "We'll email you again once it ships.";
        sendEmailBestEffort(emailForOrder, "Your ceramics store order confirmation", body);
    }

    return {outcome: "created", 'order, message: ()};
}
