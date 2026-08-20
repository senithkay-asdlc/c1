import ballerina/sql;

function mapProductRow(ProductRow row) returns Product {
    "active"|"retired" status = row.status == "retired" ? "retired" : "active";
    Product product = {
        id: row.id,
        name: row.name,
        price: row.price,
        stockQty: row.stockQty,
        status: status,
        lowStock: row.stockQty <= lowStockThreshold
    };
    string? description = row.description;
    if description is string {
        product.description = description;
    }
    string? category = row.category;
    if category is string {
        product.category = category;
    }
    string? imagesJson = row.images;
    if imagesJson is string {
        string[]|error images = imagesJson.fromJsonStringWithType();
        if images is string[] {
            product.images = images;
        }
    }
    return product;
}

function isProductInputValid(ProductInput input) returns boolean {
    return input.price >= 0d && input.stockQty >= 0;
}

function listProductsImpl(string? search, string? category, decimal? minPrice, decimal? maxPrice,
        boolean? lowStock, int limitVal, int offsetVal) returns inline_response_200|error {
    sql:ParameterizedQuery whereClause = `WHERE status = 'active'`;
    if search is string {
        string pattern = "%" + search + "%";
        whereClause = sql:queryConcat(whereClause, ` AND (name ILIKE ${pattern} OR description ILIKE ${pattern})`);
    }
    if category is string {
        whereClause = sql:queryConcat(whereClause, ` AND category = ${category}`);
    }
    if minPrice is decimal {
        whereClause = sql:queryConcat(whereClause, ` AND price >= ${minPrice}`);
    }
    if maxPrice is decimal {
        whereClause = sql:queryConcat(whereClause, ` AND price <= ${maxPrice}`);
    }
    if lowStock is boolean && lowStock {
        whereClause = sql:queryConcat(whereClause, ` AND stock_qty <= ${lowStockThreshold}`);
    }

    sql:ParameterizedQuery countQuery = sql:queryConcat(`SELECT count(*) AS total FROM products `, whereClause);
    record {|int total;|} countRow = check dbClient->queryRow(countQuery);
    int count = countRow.total;

    sql:ParameterizedQuery dataQuery = sql:queryConcat(
        `SELECT id, name, description, price, category, stock_qty AS stockQty, images, status FROM products `,
        whereClause,
        ` ORDER BY name LIMIT ${limitVal} OFFSET ${offsetVal}`
    );
    stream<ProductRow, sql:Error?> rows = dbClient->query(dataQuery);
    Product[] products = [];
    check from ProductRow row in rows
        do {
            products.push(mapProductRow(row));
        };
    check rows.close();

    string? next = offsetVal + limitVal < count
        ? string `/products?limit=${limitVal}&offset=${offsetVal + limitVal}` : ();
    int previousOffset = offsetVal - limitVal;
    string? previous = offsetVal > 0
        ? string `/products?limit=${limitVal}&offset=${previousOffset < 0 ? 0 : previousOffset}` : ();

    return {count, next, previous, data: products};
}

function getProductImpl(string productId) returns Product?|error {
    ProductRow|error row = dbClient->queryRow(`
        SELECT id, name, description, price, category, stock_qty AS stockQty, images, status
        FROM products WHERE id = ${productId}
    `);
    if row is error {
        if isNoRows(row) {
            return ();
        }
        return row;
    }
    return mapProductRow(row);
}

function createProductImpl(ProductInput input) returns Product|error {
    string id = newId();
    string? imagesJson = ();
    string[]? images = input.images;
    if images is string[] {
        imagesJson = images.toJsonString();
    }
    _ = check dbClient->execute(`
        INSERT INTO products (id, name, description, price, category, stock_qty, images, status)
        VALUES (${id}, ${input.name}, ${input?.description}, ${input.price}, ${input?.category},
                ${input.stockQty}, ${imagesJson}, 'active')
    `);
    Product? created = check getProductImpl(id);
    if created is () {
        return error("failed to load newly created product");
    }
    return created;
}

function updateProductImpl(string productId, ProductInput input) returns Product?|error {
    string? imagesJson = ();
    string[]? images = input.images;
    if images is string[] {
        imagesJson = images.toJsonString();
    }
    sql:ExecutionResult result = check dbClient->execute(`
        UPDATE products
        SET name = ${input.name}, description = ${input?.description}, price = ${input.price},
            category = ${input?.category}, stock_qty = ${input.stockQty}, images = ${imagesJson}
        WHERE id = ${productId}
    `);
    if !wasRowAffected(result) {
        return ();
    }
    return getProductImpl(productId);
}

function retireProductImpl(string productId) returns boolean|error {
    sql:ExecutionResult result = check dbClient->execute(`UPDATE products SET status = 'retired' WHERE id = ${productId}`);
    return wasRowAffected(result);
}

function wasRowAffected(sql:ExecutionResult result) returns boolean {
    int|() affected = result.affectedRowCount;
    if affected is int {
        return affected > 0;
    }
    return false;
}
