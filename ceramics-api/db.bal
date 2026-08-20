import ballerina/sql;
import ballerina/uuid;
import ballerinax/postgresql;
import ballerinax/postgresql.driver as _;

final int dbPort = check int:fromString(dbPortStr);

final postgresql:Client dbClient = check new (
    host = dbHost,
    port = dbPort,
    username = dbUser,
    password = dbPassword,
    database = dbName
);

// Runs once at module start-up: creates the schema if it does not already exist.
function init() returns error? {
    _ = check dbClient->execute(`
        CREATE TABLE IF NOT EXISTS products (
            id VARCHAR(64) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            price NUMERIC(12,2) NOT NULL,
            category VARCHAR(128),
            stock_qty INTEGER NOT NULL,
            images TEXT,
            status VARCHAR(16) NOT NULL DEFAULT 'active',
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    `);
    _ = check dbClient->execute(`
        CREATE TABLE IF NOT EXISTS carts (
            id VARCHAR(64) PRIMARY KEY,
            customer_id VARCHAR(128),
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    `);
    _ = check dbClient->execute(`
        CREATE TABLE IF NOT EXISTS cart_items (
            cart_id VARCHAR(64) NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
            product_id VARCHAR(64) NOT NULL REFERENCES products(id),
            quantity INTEGER NOT NULL,
            PRIMARY KEY (cart_id, product_id)
        )
    `);
    _ = check dbClient->execute(`
        CREATE TABLE IF NOT EXISTS orders (
            id VARCHAR(64) PRIMARY KEY,
            customer_id VARCHAR(128),
            status VARCHAR(16) NOT NULL,
            subtotal NUMERIC(12,2) NOT NULL,
            shipping_fee NUMERIC(12,2) NOT NULL,
            total NUMERIC(12,2) NOT NULL,
            shipping_line1 VARCHAR(255) NOT NULL,
            shipping_line2 VARCHAR(255),
            shipping_city VARCHAR(128) NOT NULL,
            shipping_postal_code VARCHAR(32) NOT NULL,
            shipping_country VARCHAR(8) NOT NULL,
            email VARCHAR(255),
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    `);
    _ = check dbClient->execute(`
        CREATE TABLE IF NOT EXISTS order_items (
            order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
            product_id VARCHAR(64) NOT NULL,
            name VARCHAR(255) NOT NULL,
            quantity INTEGER NOT NULL,
            unit_price NUMERIC(12,2) NOT NULL,
            PRIMARY KEY (order_id, product_id)
        )
    `);
    return;
}

function newId() returns string {
    return uuid:createType4AsString();
}

// SQL row shapes — column aliases in every query below are camelCase so these
// bind directly without an extra mapping step.

type ProductRow record {|
    string id;
    string name;
    string? description;
    decimal price;
    string? category;
    int stockQty;
    string? images;
    string status;
|};

type CartRow record {|
    string id;
    string? customerId;
|};

type CartItemRow record {|
    string productId;
    string name;
    decimal unitPrice;
    int quantity;
|};

type OrderRow record {|
    string id;
    string? customerId;
    string status;
    decimal subtotal;
    decimal shippingFee;
    decimal total;
    string shippingLine1;
    string? shippingLine2;
    string shippingCity;
    string shippingPostalCode;
    string shippingCountry;
    string? email;
    string createdAt;
|};

type OrderItemRow record {|
    string productId;
    string name;
    int quantity;
    decimal unitPrice;
|};

// Converts a stored SQL error into the appropriate not-found signal at the
// call site: sql:NoRowsError means "no such row", never a 500.
function isNoRows(error e) returns boolean {
    return e is sql:NoRowsError;
}
