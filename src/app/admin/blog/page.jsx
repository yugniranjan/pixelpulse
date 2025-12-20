"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BlogEditor from "@/components/Editor";

export default function CreateBlog() {
  const [content, setContent] = useState(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const publishBlog = async () => {
    setLoading(true);

    const res = await fetch("/api/create-blog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });

    const data = await res.json();

    if (data.success) {
      // ✅ reset
      setTitle("");
      setContent(null);

      // ✅ redirect
      router.push("/admin/blogs");
    }

    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 800, margin: "40px auto" }}>
      <h1>Admin Blog Editor</h1>

      <input
        placeholder="Blog Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ width: "100%", padding: 10, marginBottom: 20 }}
      />

      <BlogEditor onChange={setContent} />

      <div style={{ display: "flex", gap: "16px", marginTop: "20px" }}>
        <button
          onClick={publishBlog}
          disabled={!content || loading}
          style={{
            padding: "10px 24px",
            borderRadius: "8px",
            fontWeight: "600",
            backgroundColor: !content || loading ? "#ccc" : "#2563eb",
            color: !content || loading ? "#555" : "#fff",
            border: "none",
            cursor: !content || loading ? "not-allowed" : "pointer",
            transition: "background-color 0.2s",
          }}
        >
          {loading ? "Publishing..." : "Publish"}
        </button>

        <button
          onClick={() => console.log("Preview clicked!")}
          style={{
            padding: "10px 24px",
            borderRadius: "8px",
            fontWeight: "600",
            backgroundColor: "#f3f4f6",
            color: "#111",
            border: "none",
            cursor: "pointer",
            transition: "background-color 0.2s",
          }}
        >
          Preview
        </button>
      </div>
    </div>
  );
}
