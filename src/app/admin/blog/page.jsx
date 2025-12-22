"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { toast } from "sonner";

const BlogEditor = dynamic(() => import("@/components/Editor"), {
  ssr: false,
});

export default function CreateBlog() {
  const router = useRouter();

  const editorDataRef = useRef(null);   // 🔥 editor content
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const publishBlog = async () => {
    if (!editorDataRef.current) {
      toast.error("Please write some content");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/create-blog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        content: editorDataRef.current,
      }),
    });

    const data = await res.json();

    if (data.success) {
      // ✅ clear autosave draft
      localStorage.removeItem("blog-draft-new");

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
        style={{
          width: "100%",
          padding: 10,
          marginBottom: 20,
        }}
      />

      {/* 🔥 IMPORTANT */}
      <BlogEditor
        onChangeData={(data) => {
          editorDataRef.current = data;
        }}
      />

      <div style={{ display: "flex", gap: "16px", marginTop: 20 }}>
        <button
          onClick={publishBlog}
          disabled={loading}
          style={{
            padding: "10px 24px",
            borderRadius: 8,
            fontWeight: 600,
            backgroundColor: loading ? "#ccc" : "#2563eb",
            color: loading ? "#555" : "#fff",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Publishing..." : "Publish"}
        </button>

        <button
          onClick={() => console.log("Preview clicked")}
          style={{
            padding: "10px 24px",
            borderRadius: 8,
            fontWeight: 600,
            backgroundColor: "#f3f4f6",
            border: "none",
            cursor: "pointer",
          }}
        >
          Preview
        </button>
      </div>
    </div>
  );
}
