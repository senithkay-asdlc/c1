import ballerina/os;

// ceramics-db (platform-resource, postgres-cnpg)
configurable string dbHost = os:getEnv("CERAMICS_DB_HOST");
configurable string dbPortStr = os:getEnv("CERAMICS_DB_PORT");
configurable string dbUser = os:getEnv("CERAMICS_DB_USER");
configurable string dbPassword = os:getEnv("CERAMICS_DB_PASSWORD");
configurable string dbName = os:getEnv("CERAMICS_DB_DBNAME");

// payment-provider (external, Stripe-shaped REST API)
configurable string stripeApiKey = os:getEnv("STRIPE_API_KEY");

// email-provider (external, SendGrid-shaped REST API)
configurable string sendgridApiKey = os:getEnv("SENDGRID_API_KEY");
configurable string sendgridFromEmail = os:getEnv("SENDGRID_FROM_EMAIL");

// Internal store settings — not platform-injected, sensible defaults so the
// component starts with no required environment variables.
configurable int lowStockThreshold = 5;
configurable decimal flatShippingFee = 5.00;
configurable decimal freeShippingThreshold = 75.00;
