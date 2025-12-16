"use client";

import { clearAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const logout = () => {
    clearAuth();
    router.replace("/login");
  };

  return (
    <button
      onClick={logout}
      className="px-4 py-2 rounded-lg bg-rose-600 text-white"
    >
      Đăng xuất
    </button>
  );
}
