import { NextResponse } from "next/server";

export default function handlePost(handler) {
  return async function (req, context) {
    try {
      return await handler(req, context);
    } catch (err) {
      console.error("API Error:", err);

      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }
  };
}