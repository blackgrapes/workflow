// src/app/api/admin/employees/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Employee from "@/models/user";
import bcrypt from "bcryptjs";

/* GET - fetch employee by empId (params.id) */
export async function GET(
  req: NextRequest,
  context: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
  try {
    // support both Promise or direct object
    const maybeParams = context.params;
    const params =
      maybeParams && "then" in maybeParams ? await maybeParams : maybeParams;
    const id = params?.id;

    if (!id) {
      return NextResponse.json({ error: "Employee id is required" }, { status: 400 });
    }

    await connectDB();

    const employee = await Employee.findOne({ empId: id }).select("-password").lean();
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json(employee, { status: 200 });
  } catch (err: unknown) {
    console.error("GET /api/admin/employees/[id] error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message ?? "Failed to fetch employee" },
      { status: 500 }
    );
  }
}

/* PUT - update employee by empId (params.id)
   This update handler now supports password updates:
   - If request body contains a `password` (string), it will be hashed with bcrypt before saving.
   - All other fields are updated as before.
   - Response never includes the password.
*/
export async function PUT(
  req: NextRequest,
  context: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
  try {
    const maybeParams = context.params;
    const params =
      maybeParams && "then" in maybeParams ? await maybeParams : maybeParams;
    const id = params?.id;

    if (!id) {
      return NextResponse.json({ error: "Employee id is required" }, { status: 400 });
    }

    await connectDB();

    // read body as unknown and narrow safely
    const body = (await req.json()) as unknown;

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // copy to a mutable record
    const updatedData = { ...(body as Record<string, unknown>) };

    // If password provided, validate type and hash it before DB update
    if ("password" in updatedData) {
      const pwd = updatedData.password;
      if (typeof pwd !== "string") {
        return NextResponse.json({ error: "Password must be a string" }, { status: 400 });
      }
      const trimmed = pwd.trim();
      if (trimmed.length === 0) {
        return NextResponse.json({ error: "Password must not be empty" }, { status: 400 });
      }

      // hash password
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(trimmed, salt);

      // replace plain password with hashed one
      updatedData.password = hashed;
    }

    const employee = await Employee.findOneAndUpdate(
      { empId: id },
      { $set: updatedData },
      { new: true }
    ).select("-password").lean();

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Employee updated successfully", employee },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("PUT /api/admin/employees/[id] error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message ?? "Failed to update employee" },
      { status: 500 }
    );
  }
}
