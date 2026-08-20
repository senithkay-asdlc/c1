// Shared constructors for the Error envelope every 4xx/5xx response carries.

function badRequest(string message) returns ErrorBadRequest => {body: {code: 400, message}};

function unauthorized(string message) returns ErrorUnauthorized => {body: {code: 401, message}};

function forbidden(string message) returns ErrorForbidden => {body: {code: 403, message}};

function notFound(string message) returns ErrorNotFound => {body: {code: 404, message}};

function paymentRequired(string message) returns ErrorPaymentRequired => {body: {code: 402, message}};

function internalError(string message) returns ErrorInternalServerError => {body: {code: 500, message}};
