// File: src/app/api/auth/session/route.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

export async function GET(req: NextRequest) {
  try {
    // Get token from cookies
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No token found" }, { status: 401 });
    }

    // Verify token
    const payload = jwt.verify(token, JWT_SECRET) as {
      id: string;
      empId: string;
      type: string;
      department?: string;
      name?: string;
      exp: number;
    };

    // Return payload to client
    return NextResponse.json(payload, { status: 200 });
} catch (err: unknown) {
  console.error("❌ /api/auth/session error:", err);

  // Narrow err to Error type safely
  const message = err instanceof Error ? err.message : String(err);

  return NextResponse.json(
    { error: "Invalid or expired token", details: message },
    { status: 401 }
  );
}

}
