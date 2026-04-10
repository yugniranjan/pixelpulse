"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);

    const response = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    const data = await response.json();
    if (response.ok) {
      toast.success(data.message);
      setLoading(false);
    }
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      style={{
        padding: "6px 12px",
        background: "#dc2626",
        color: "#fff",
        borderRadius: 6,
        border: "none",
        cursor: "pointer",
        fontSize: "12px",
      }}
    >
      {loading ? "Logging out..." : "Logout"}
    </button>
  );
}
