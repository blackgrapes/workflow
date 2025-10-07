// File: src/models/user.ts
import mongoose, { Schema, Document } from "mongoose";
import { EmployeeData } from "@/types/user";

export interface EmployeeDoc extends EmployeeData, Document {}

const EmployeeSchema = new Schema<EmployeeDoc>(
  {
    empId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    type: {
      type: String,
      enum: ["Employee", "Manager", "Admin"],
      required: true,
    },
    role: { type: String },
    department: { type: String },
    status: { type: String, default: "Active" },
    location: { type: String },
    createdByManagerId: { type: String }, // optional manager ID who created this employee
  },
  { timestamps: true }
);

const Employee = mongoose.models.Employee || mongoose.model<EmployeeDoc>("Employee", EmployeeSchema);
export default Employee;
