import ballerina/http;
import ballerina/url;

final http:Client stripeClient = check new ("https://api.stripe.com");

type StripePaymentIntent record {|
    string id;
    string status;
|};

type StripeErrorDetail record {|
    string message;
    string 'type;
|};

type StripeErrorBody record {|
    StripeErrorDetail 'error;
|};

type ChargeResult record {|
    boolean success;
    string chargeId?;
    string declineMessage?;
|};

// Creates and confirms a PaymentIntent for the given amount (major currency
// unit, e.g. dollars) using the client-side-tokenized payment method. Stripe
// answers a declined card with HTTP 402 and a card_error body — that maps
// directly onto this API's own 402.
function chargeCard(decimal amount, string currency, string paymentToken) returns ChargeResult|error {
    decimal centsDecimal = decimal:round(amount * 100);
    int amountMinor = <int>centsDecimal;
    string encodedToken = check url:encode(paymentToken, "UTF-8");
    string body = string `amount=${amountMinor}&currency=${currency}&confirm=true` +
        string `&payment_method=${encodedToken}&payment_method_types[]=card`;

    http:Request req = new;
    req.setTextPayload(body, contentType = "application/x-www-form-urlencoded");
    req.setHeader("Authorization", "Bearer " + stripeApiKey);
    http:Response resp = check stripeClient->post("/v1/payment_intents", req);
    json payload = check resp.getJsonPayload();

    if resp.statusCode == 402 {
        string declineMessage = "Payment declined";
        StripeErrorBody|error errBody = payload.cloneWithType(StripeErrorBody);
        if errBody is StripeErrorBody {
            declineMessage = errBody.'error.message;
        }
        return {success: false, declineMessage};
    }
    if resp.statusCode != 200 {
        return error("stripe payment_intents request failed with status " + resp.statusCode.toString());
    }
    StripePaymentIntent paymentIntent = check payload.cloneWithType(StripePaymentIntent);
    return {success: true, chargeId: paymentIntent.id};
}

// Best-effort refund used only when stock could not be reserved after the
// charge already succeeded (a race between the pre-charge stock check and
// the atomic decrement). Failure to refund is logged, never surfaced to the
// caller as a different status than the 400 insufficient-stock response.
function refundCharge(string paymentIntentId) returns error? {
    string encodedId = check url:encode(paymentIntentId, "UTF-8");
    string body = string `payment_intent=${encodedId}`;
    http:Request req = new;
    req.setTextPayload(body, contentType = "application/x-www-form-urlencoded");
    req.setHeader("Authorization", "Bearer " + stripeApiKey);
    http:Response resp = check stripeClient->post("/v1/refunds", req);
    if resp.statusCode != 200 {
        return error("stripe refund request failed with status " + resp.statusCode.toString());
    }
}
