"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { toast } from "sonner";

const BlogEditor = dynamic(() => import("@/components/Editor"), {
  ssr: false,
});

export default function EditBlog() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const router = useRouter();

  const editorDataRef = useRef(null); // 🔥 final editor data

  const [title, setTitle] = useState("");
  const [initialContent, setInitialContent] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🔹 Fetch blog only once
  useEffect(() => {
    if (!id) return;

    fetch(`/api/blogs/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setTitle(data.title);
        setInitialContent(data.content); // 👈 editor initial data
      });
  }, [id]);

  const updateBlog = async () => {
    if (!editorDataRef.current) {
      toast.error("Editor content missing");
      return;
    }

    setLoading(true);

    await fetch(`/api/blogs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        content: editorDataRef.current, // 🔥 always latest
      }),
    });

    // ✅ clear autosave draft
    localStorage.removeItem(`blog-draft-${id}`);

    router.push("/admin/blogs");
  };

  if (!initialContent) {
    return <p style={{ textAlign: "center" }}>Loading editor...</p>;
  }

  return (
    <div style={{ maxWidth: 800, margin: "40px auto" }}>
      <h1>Edit Blog</h1>

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

      {/* 🔥 Editor */}
      <BlogEditor
        blogId={id}
        apiData={initialContent} // only once
        onChangeData={(data) => {
          editorDataRef.current = data;
        }}
      />

      <div style={{ display: "flex", gap: 16, marginTop: 20 }}>
        <button
          onClick={updateBlog}
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
          {loading ? "Updating..." : "Update"}
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
