"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import BlogEditor from "@/components/Editor";

export default function EditBlog() {
  const para = useSearchParams();
  const id = para.get("id");

  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState(null);

  useEffect(() => {
    fetch(`/api/blogs/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setTitle(data.title);
        setContent(data.content); // ✅ editor data
      });
  }, [id]);

  const updateBlog = async () => {
    await fetch(`/api/blogs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });

    router.push("/admin/blogs");
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

      <BlogEditor value={content} onChange={setContent} />

      <div style={{ display: "flex", gap: "16px", marginTop: "20px" }}>
        <button
          onClick={updateBlog}
        //   disabled={!content || loading}
          style={{
            padding: "10px 24px",
            borderRadius: "8px",
            fontWeight: "600",
            // backgroundColor: !content || loading ? "#ccc" : "#2563eb",
            // color: !content || loading ? "#555" : "#fff",
            border: "none",
            // cursor: !content || loading ? "not-allowed" : "pointer",
            transition: "background-color 0.2s",
          }}
        >
          {/* {loading ? "Updateing..." : "Update"} */}
          Update
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
