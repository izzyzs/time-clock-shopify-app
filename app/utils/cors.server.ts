// app/utils/cors.server.ts

const allowedOrigins = [
  "https://extensions.shopifycdn.com",
  "https://cdn.shopify.com",
  "https://admin.shopify.com",
  "https://pos.shopify.com",
];

export function getCorsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("Origin");

  // During early development, you can temporarily allow all origins.
  // Later, tighten this.
  const allowOrigin = origin && allowedOrigins.includes(origin) ? origin : "*";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

export function handleCorsPreflight(request: Request) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(request),
    });
  }

  return null;
}
