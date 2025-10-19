"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// JWT Payload type from backend
export interface JWTPayload {
  id: string;           // ✅ MongoDB ObjectId
  empId: string;        // legacy employee code, e.g., CS-EMP-83762
  name?: string;        // Employee/Manager/Admin name
  type: string;         // Admin, Manager, Employee, etc
  department?: string;
  exp: number;          // token expiry timestamp
}

// Normalized session type
export interface EmployeeSession {
  role: string;
  employeeId: string;   // legacy employee ID
  mongoId?: string;     // ✅ MongoDB ObjectId
  department?: string;
  name?: string;
}

export function useSession() {
  const router = useRouter();
  const [session, setSession] = useState<EmployeeSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSession() {
      try {
        console.log("⏳ Fetching session from /api/auth/session...");
        const res = await fetch("/api/auth/session", {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          router.push("/");
          return;
        }

        const data: JWTPayload = await res.json();
        console.log("✅ Session data fetched:", data);

        // Check token expiry
        const currentTime = Date.now() / 1000;
        if (data.exp < currentTime) {
          router.push("/");
          return;
        }

        // Normalize role for UI consistency
        const normalizedRole = data.type.toLowerCase().replace(/\s+/g, "-");

        // Map JWT payload to session object
        const normalizedSession: EmployeeSession = {
          role: normalizedRole,
          employeeId: data.empId, // legacy ID
          mongoId: data.id,       // ✅ MongoDB ObjectId
          department: data.department,
          name: data.name,
        };

        setSession(normalizedSession);
      } catch (err) {
        console.error("❌ Session fetch error:", err);
        router.push("/");
      } finally {
        setLoading(false);
      }
    }

    fetchSession();
  }, [router]);

  return { session, loading };
}
