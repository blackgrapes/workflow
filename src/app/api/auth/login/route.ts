// File: src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb"; // MongoDB connection
import Employee from "@/models/user";       // Employee model
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// JWT secret (keep in .env)
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// Request body interface
interface LoginRequestBody {
  type: "employee" | "manager" | "admin";
  empId: string;
  password: string;
}

export async function POST(req: NextRequest) {
  try {
    console.log("🔹 Login API called");

    // Connect to MongoDB
    await connectDB();
    console.log("✅ MongoDB connected");

    // Parse request body
    const body: LoginRequestBody = await req.json();
    const { empId, password, type } = body;

    // Validate input
    if (!empId || !password || !type) {
      return NextResponse.json(
        { error: "Missing empId, password, or type" },
        { status: 400 }
      );
    }

    // Case-insensitive type match
    const employee = await Employee.findOne({
      empId,
      type: new RegExp(`^${type}$`, "i"),
    });

    if (!employee) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: employee._id,
        empId: employee.empId,
        name: employee.name,         // include name
        type: employee.type,
        department: employee.department,
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    // ✅ Create response
    const res = NextResponse.json({
      message: "Login successful",
      employee: {
        empId: employee.empId,
        name: employee.name,
        type: employee.type,
        department: employee.department,
      },
    });

    // Set cookie (HTTP-only for security)
    res.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,            // cannot be accessed by JS
      path: "/",                 // available on all routes
      maxAge: 8 * 60 * 60,       // 8 hours
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return res;
} catch (err: unknown) {
  console.error("❌ POST /api/auth/login Error:", err);

  // Safely get the error message
  const message = err instanceof Error ? err.message : String(err);

  return NextResponse.json(
    { error: "Login failed", details: message },
    { status: 500 }
  );
}

}
