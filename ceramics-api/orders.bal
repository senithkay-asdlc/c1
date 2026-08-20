import ballerina/sql;

function loadOrderItems(string orderId) returns OrderItem[]|error {
    stream<OrderItemRow, sql:Error?> rows = dbClient->query(`
        SELECT product_id AS productId, name, quantity, unit_price AS unitPrice
        FROM order_items WHERE order_id = ${orderId}
        ORDER BY name
    `);
    OrderItem[] items = [];
    check from OrderItemRow row in rows
        do {
            items.push({productId: row.productId, name: row.name, quantity: row.quantity, unitPrice: row.unitPrice});
        };
    check rows.close();
    return items;
}

function mapOrderRow(OrderRow row, OrderItem[] items) returns Order {
    "paid"|"fulfilled"|"cancelled" status = "paid";
    if row.status == "fulfilled" {
        status = "fulfilled";
    } else if row.status == "cancelled" {
        status = "cancelled";
    }
    Address address = {
        line1: row.shippingLine1,
        city: row.shippingCity,
        postalCode: row.shippingPostalCode,
        country: row.shippingCountry
    };
    string? line2 = row.shippingLine2;
    if line2 is string {
        address.line2 = line2;
    }
    Order 'order = {
        id: row.id,
        status,
        items,
        subtotal: row.subtotal,
        shippingFee: row.shippingFee,
        total: row.total,
        shippingAddress: address,
        createdAt: row.createdAt
    };
    string? customerId = row.customerId;
    if customerId is string {
        'order.customerId = customerId;
    }
    return 'order;
}

function getOrderRow(string orderId) returns OrderRow?|error {
    OrderRow|error row = dbClient->queryRow(`
        SELECT id, customer_id AS customerId, status, subtotal, shipping_fee AS shippingFee, total,
               shipping_line1 AS shippingLine1, shipping_line2 AS shippingLine2, shipping_city AS shippingCity,
               shipping_postal_code AS shippingPostalCode, shipping_country AS shippingCountry, email,
               to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS createdAt
        FROM orders WHERE id = ${orderId}
    `);
    if row is error {
        if isNoRows(row) {
            return ();
        }
        return row;
    }
    return row;
}

function getOrderImpl(string orderId) returns Order?|error {
    OrderRow? row = check getOrderRow(orderId);
    if row is () {
        return ();
    }
    OrderItem[] items = check loadOrderItems(orderId);
    return mapOrderRow(row, items);
}

function listOrdersImpl(CallerRole role, string? callerUserId, string? status, int limitVal, int offsetVal)
        returns inline_response_200_1|error {
    sql:ParameterizedQuery whereClause = ` WHERE 1 = 1`;
    if role != ADMIN {
        whereClause = sql:queryConcat(whereClause, ` AND customer_id = ${callerUserId}`);
    }
    if status is string {
        whereClause = sql:queryConcat(whereClause, ` AND status = ${status}`);
    }

    sql:ParameterizedQuery countQuery = sql:queryConcat(`SELECT count(*) AS total FROM orders`, whereClause);
    record {|int total;|} countRow = check dbClient->queryRow(countQuery);
    int count = countRow.total;

    sql:ParameterizedQuery dataQuery = sql:queryConcat(`
        SELECT id, customer_id AS customerId, status, subtotal, shipping_fee AS shippingFee, total,
               shipping_line1 AS shippingLine1, shipping_line2 AS shippingLine2, shipping_city AS shippingCity,
               shipping_postal_code AS shippingPostalCode, shipping_country AS shippingCountry, email,
               to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS createdAt
        FROM orders`, whereClause, ` ORDER BY created_at DESC LIMIT ${limitVal} OFFSET ${offsetVal}`);
    stream<OrderRow, sql:Error?> rows = dbClient->query(dataQuery);
    Order[] orders = [];
    check from OrderRow row in rows
        do {
            OrderItem[] items = check loadOrderItems(row.id);
            orders.push(mapOrderRow(row, items));
        };
    check rows.close();

    string? next = offsetVal + limitVal < count
        ? string `/orders?limit=${limitVal}&offset=${offsetVal + limitVal}` : ();
    int previousOffset = offsetVal - limitVal;
    string? previous = offsetVal > 0
        ? string `/orders?limit=${limitVal}&offset=${previousOffset < 0 ? 0 : previousOffset}` : ();

    return {count, next, previous, data: orders};
}

function fulfillOrderImpl(string orderId) returns Order?|error {
    sql:ExecutionResult result = check dbClient->execute(`UPDATE orders SET status = 'fulfilled' WHERE id = ${orderId}`);
    if !wasRowAffected(result) {
        return ();
    }
    OrderRow? row = check getOrderRow(orderId);
    if row is () {
        return ();
    }
    OrderItem[] items = check loadOrderItems(orderId);
    Order fulfilledOrder = mapOrderRow(row, items);
    string? email = row.email;
    if email is string {
        string body = string `Your order ${orderId} has shipped. Thank you for shopping with us!`;
        sendEmailBestEffort(email, "Your ceramics store order has shipped", body);
    }
    return fulfilledOrder;
}
