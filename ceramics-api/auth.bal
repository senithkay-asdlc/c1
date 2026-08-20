// The gateway has already validated the caller's token; this service only
// reads the identity it injected. Never validate a JWT here.

public enum CallerRole {
    ADMIN,
    SHOPPER,
    GUEST
}

// Resolves the caller's role from the gateway-injected X-User-Groups header.
// A caller with no recognized admin group, but a caller id, is a Shopper. No
// caller id at all is a guest. Missing-recognized-role on a protected
// endpoint is a 403 at the call site — never a 401 — 401 is reserved for a
// missing X-User-Id.
function resolveRole(string? userId, string? userGroups) returns CallerRole {
    if userId is () {
        return GUEST;
    }
    if userGroups is string {
        string[] groups = parseGroups(userGroups);
        foreach string g in groups {
            if g.toLowerAscii().includes("admin") {
                return ADMIN;
            }
        }
    }
    return SHOPPER;
}

// X-User-Groups arrives as a JSON array (e.g. ["Store Admin"]); a
// comma-separated string is accepted as a fallback.
function parseGroups(string header) returns string[] {
    json|error parsed = header.fromJsonString();
    if parsed is json[] {
        string[] result = [];
        foreach json item in parsed {
            if item is string {
                result.push(item);
            }
        }
        return result;
    }
    return re `\s*,\s*`.split(header);
}
