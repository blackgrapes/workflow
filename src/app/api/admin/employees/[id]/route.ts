// src/app/api/admin/employees/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Employee from "@/models/user";

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

/* PUT - update employee by empId (params.id) */
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

    const updatedData: Partial<typeof Employee> = await req.json();

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
