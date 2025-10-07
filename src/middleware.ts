// File: middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Middleware function
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  console.log("🌐 Middleware running for:", pathname);

  // Allow public routes (login, APIs, static files, _next)
  if (
    pathname === "/" ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    pathname.startsWith("/_next")
  ) {
    console.log("✅ Public route, allowing access");
    return NextResponse.next();
  }

  // Get token from cookies
  const token = req.cookies.get("token")?.value;
  if (!token) {
    console.warn("⚠️ No token found, redirecting to login");
    return NextResponse.redirect(new URL("/", req.url));
  }

  try {
    // Decode JWT payload
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    const payload = JSON.parse(Buffer.from(payloadBase64, "base64").toString("utf8"));

    // Check expiration
    const currentTime = Date.now() / 1000;
    if (payload.exp < currentTime) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // const userType = (payload.type || "").toLowerCase();

    // Role-based route protection
    // if (pathname.startsWith("/admin") && userType !== "admin") {
    //   console.warn("⚠️ Unauthorized admin access attempt");
    //   return NextResponse.redirect(new URL("/", req.url));
    // }

    // if (pathname.startsWith("/manager") && userType !== "manager") {
    //   console.warn("⚠️ Unauthorized manager access attempt");
    //   return NextResponse.redirect(new URL("/", req.url));
    // }

    // if (pathname.startsWith("/employee") && userType !== "employee") {
    //   console.warn("⚠️ Unauthorized employee access attempt");
    //   return NextResponse.redirect(new URL("/", req.url));
    // }

  } catch (err) {
    console.error("❌ Middleware token error:", err);
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

// Apply middleware to all routes except static files
export const config = {
  matcher: ["/((?!_next/static|favicon.ico).*)"],
};
