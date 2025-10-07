// File: src/app/login/page.tsx
"use client";

import { useRouter } from "next/navigation";
import LoginForm from "./component/login/loginForm";
import { loginEmployee, EmployeeType } from "@/lib/frontendApis/login/authApi";

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = async (
    type: EmployeeType,
    empId: string,
    password: string
  ) => {
    try {
      // Call login API
      const result = await loginEmployee({ type, empId, password });

      console.log("API Response:", result);

      // Redirect to single dashboard for all roles
      router.push("/dashboard");
   } catch (err: unknown) {
  if (err instanceof Error) {
    alert(`Login failed: ${err.message}`);
  } else {
    alert(`Login failed: ${String(err)}`);
  }
}

  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <LoginForm onLogin={handleLogin} />
    </div>
  );
}
