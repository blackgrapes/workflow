"use client";

import { usePathname } from "next/navigation";
import Navbar from "./layout/navbar";
import Sidebar from "./layout/sidebar";
import Footer from "./layout/footer";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/";

  return (
    <>
      {!isLoginPage && <Navbar />}

      <div className="flex flex-1 overflow-hidden">
        {!isLoginPage && <Sidebar className="sticky top-0" />}

        <main className={`flex-1 p-6 overflow-y-auto ${!isLoginPage ? "bg-gray-50" : ""}`}>
          {children}
        </main>
      </div>

      {!isLoginPage && <Footer />}
    </>
  );
}
