import { NextResponse } from "next/server";

/**
 * Wrap your POST logic with this handler
 * @param {Function} fn - async function(req) => NextResponse
 * @returns a handler function usable in route.js
 */
export function createPostHandler(fn) {
  return async function handler(req) {
    if (req.method !== "POST") {
      return NextResponse.json(
        { error: "Method Not Allowed" },
        { status: 405 }
      );
    }

    try {
      // Call the actual POST logic
      const res = await fn(req);

      // Add CORS headers (optional, adjust for production)
      res.headers.set("Access-Control-Allow-Origin", "*"); 
      res.headers.set("Access-Control-Allow-Methods", "POST");

      return res;
    } catch (err) {
      console.error("POST handler error:", err);
      return NextResponse.json(
        { error: "Server Error" },
        { status: 500 }
      );
    }
  };
}