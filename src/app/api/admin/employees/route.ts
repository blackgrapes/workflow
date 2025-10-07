// src/app/api/employee/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Employee from "@/models/user";
import { EmployeeData } from "@/types/user";
import bcrypt from "bcryptjs";

// Type guard for unknown error
const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Unknown error";

// POST: Create Employee
export async function POST(req: NextRequest) {
  console.group("🟢 POST /api/employee");

  try {
    console.log("🔹 Connecting to MongoDB...");
    await connectDB();
    console.log("✅ MongoDB connected");

    const employee: EmployeeData = await req.json();
    console.log("🔹 Received employee data:", employee);

    const requiredFields = ["empId", "name", "phone", "type", "password"];
    for (const field of requiredFields) {
      if (!employee[field as keyof EmployeeData]) {
        console.warn(`❌ Missing required field: ${field}`);
        console.groupEnd();
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    console.log("🔹 Checking for duplicate employee...");
    const duplicate = await Employee.findOne({
      $or: [{ empId: employee.empId }, { phone: employee.phone }],
    });
    if (duplicate) {
      console.warn("❌ Duplicate employee found:", duplicate);
      console.groupEnd();
      return NextResponse.json(
        { error: "Employee with this ID or phone already exists" },
        { status: 400 }
      );
    }

    console.log("🔹 Hashing password...");
    const hashedPassword = await bcrypt.hash(employee.password!, 10);
    console.log("✅ Password hashed");

    const newEmployee = new Employee({
      empId: employee.empId,
      name: employee.name,
      phone: employee.phone,
      password: hashedPassword,
      type: employee.type,
      role: employee.role,
      department: employee.department,
      status: employee.status || "Active",
      location: employee.location || "",
      createdByManagerId: employee.createdByManagerId || undefined,
    });

    console.log("🔹 Saving new employee...");
    await newEmployee.save();
    console.log("✅ Employee saved successfully:", newEmployee._id);

    // Exclude password from response
    const {  ...employeeWithoutPassword } = newEmployee.toObject();
    console.log("🔹 Returning employee (without password):", employeeWithoutPassword);

    console.groupEnd();
    return NextResponse.json(
      { message: "Employee created successfully", employee: employeeWithoutPassword },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("❌ POST /api/employee Error:", error);
    console.groupEnd();
    return NextResponse.json(
      { error: "Failed to create employee", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}


// GET: Get all employees or only manager employees
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const managerId = searchParams.get("managerId");

    const employees = managerId
      ? await Employee.find({ createdByManagerId: managerId }).select("-password")
      : await Employee.find({}).select("-password");

    return NextResponse.json(employees, { status: 200 });
  } catch (error: unknown) {
    console.error("GET /api/employee Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch employees", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

// DELETE: Remove Employee
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();

    const body: { empId?: string } = await req.json();

    if (!body.empId) {
      return NextResponse.json({ error: "Employee ID is required" }, { status: 400 });
    }

    const deleted = await Employee.deleteOne({ empId: body.empId });

    if (deleted.deletedCount === 0) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Employee removed successfully" }, { status: 200 });
  } catch (error: unknown) {
    console.error("DELETE /api/employee Error:", error);
    return NextResponse.json(
      { error: "Failed to delete employee", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
