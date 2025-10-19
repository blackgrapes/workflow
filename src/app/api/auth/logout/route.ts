// File: src/app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST() {
  try {
    // Create response
    const res = NextResponse.json({ message: "Logged out successfully" });

    // Clear the cookie by setting maxAge=0
    res.cookies.set({
      name: "token",
      value: "",
      httpOnly: true,
      path: "/",
      maxAge: 0,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return res;
  } catch (err: unknown) {
    console.error("❌ /api/auth/logout error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Logout failed", details: message },
      { status: 500 }
    );
  }
}
