// src/app/api/client/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Lead from "@/models/lead";

interface Client {
  marka: string;
  customerName?: string;
  contactNumber?: string;
  city?: string;
  state?: string;
  totalLeads: number;
  leadIds: string[];
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const userId: string = body.userId;
    const role: string = body.role;

    if (!userId || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fetch leads depending on role
    const leadsRaw = role.toLowerCase() === "admin"
      ? await Lead.find({}).lean()
      : await Lead.find({ "customerService.employeeId": userId }).lean();

    // Aggregate clients by marka + customerName (in case same marka but different customers)
    const clientMap: Record<string, Client> = {};

    leadsRaw.forEach((lead) => {
      const cs = lead.customerService || {};
      const marka = cs.marka || "Unknown";
      const customerName = cs.customerName || "Unknown";
      const contactNumber = cs.contactNumber || "";
      const city = cs.city || "";
      const state = cs.state || "";

      const key = `${marka}_${customerName}_${contactNumber}`; // unique per client

      if (!clientMap[key]) {
        clientMap[key] = {
          marka,
          customerName,
          contactNumber,
          city,
          state,
          totalLeads: 1,
          leadIds: [lead.leadId ?? "Unknown"],
        };
      } else {
        clientMap[key].totalLeads += 1;
        clientMap[key].leadIds.push(lead.leadId ?? "Unknown");
      }
    });

    const clients = Object.values(clientMap);

    return NextResponse.json({ clients });
  } catch (err) {
    console.error("API /api/client error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
