import ballerina/http;
import ballerina/log;

final http:Client sendGridClient = check new ("https://api.sendgrid.com");

type SendGridEmailAddress record {|
    string email;
|};

type SendGridPersonalization record {|
    SendGridEmailAddress[] to;
|};

type SendGridContent record {|
    string 'type;
    string value;
|};

type SendGridMailRequest record {|
    SendGridPersonalization[] personalizations;
    SendGridEmailAddress 'from;
    string subject;
    SendGridContent[] content;
|};

// Sends a plain-text email via SendGrid's Mail Send v3 API. A 202 with an
// empty body is success; anything else is surfaced as an error. Failing to
// send never fails the caller's request — the caller logs and moves on.
function sendEmail(string toAddress, string subject, string bodyText) returns error? {
    SendGridMailRequest mailRequest = {
        personalizations: [{to: [{email: toAddress}]}],
        'from: {email: sendgridFromEmail},
        subject,
        content: [{'type: "text/plain", value: bodyText}]
    };
    http:Request req = new;
    req.setJsonPayload(mailRequest.toJson());
    req.setHeader("Authorization", "Bearer " + sendgridApiKey);
    http:Response resp = check sendGridClient->post("/v3/mail/send", req);
    if resp.statusCode != 202 {
        return error("sendgrid mail/send request failed with status " + resp.statusCode.toString());
    }
}

function sendEmailBestEffort(string? toAddress, string subject, string bodyText) {
    if toAddress is () {
        return;
    }
    error? result = sendEmail(toAddress, subject, bodyText);
    if result is error {
        log:printError("failed to send email", 'error = result, subject = subject);
    }
}
