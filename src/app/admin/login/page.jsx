"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import "../../styles/admin-login.css";
import { toast } from "sonner";

export default function AdminLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });

    const data = await res.json();

    if (res.ok) {
      toast.success(data.message);
      router.push("/admin/blogs");
      router.refresh();
    } else {
      alert("Invalid credentials");
    }

    setLoading(false);
  }

  return (
    <div className="login-wrapper">
      <form className="login-card" onSubmit={handleLogin}>
        <div className="login-header">
          <h2>Admin Login</h2>
          <p>Sign in to manage admin dashboard</p>
        </div>

        <div className="form-group">
          <label>Email</label>
          <input name="email" placeholder="admin@example.com" required />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            name="password"
            type="password"
            placeholder="••••••••"
            required
          />
        </div>

        <button className="login-btn" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="login-footer">Authorized access only</p>
      </form>
    </div>
  );
}
