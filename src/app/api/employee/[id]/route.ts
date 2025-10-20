  // app/api/employee/[id]/route.ts
  import { NextResponse } from "next/server";
  import { connectDB } from "@/lib/mongodb";
  import Lead from "@/models/lead";

  export async function GET() {
    try {

      await connectDB();
      // Fetch all leads without filtering
      const allLeads = await Lead.find({})
        .sort({ createdAt: -1 })
        .lean();
      return NextResponse.json({ leads: allLeads }, { status: 200 });
    } catch (err) {
      console.error("❌ GET /api/employee/[id] error:", err);
      return NextResponse.json(
        { message: "Internal server error", error: (err as Error).message },
        { status: 500 }
      );
    }
  }
