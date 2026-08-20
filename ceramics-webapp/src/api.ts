import createClient, { type Middleware } from "openapi-fetch";
import type { paths } from "./generated/ceramics-api";
import { getAccessToken } from "./auth";

// Same-origin: nginx reverse-proxies /api/ to the sibling ceramics-api pod.
export const api = createClient<paths>({ baseUrl: "/api" });

// Attach the caller's bearer token, when one exists, to every request. Public
// endpoints (catalog browse, guest checkout) ignore the header; protected
// endpoints (admin writes, order history) need it.
const authMiddleware: Middleware = {
  async onRequest({ request }) {
    const token = await getAccessToken();
    if (token) {
      request.headers.set("Authorization", `Bearer ${token}`);
    }
    return request;
  },
};

api.use(authMiddleware);
