"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import ImageUploader from "@/components/ImageUploader";

const BlogEditor = dynamic(() => import("@/components/Editor"), {
  ssr: false,
});

export default function EditBlog() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const router = useRouter();

  const editorDataRef = useRef(null);

  const [title, setTitle] = useState("");
  const [initialContent, setInitialContent] = useState(null);
  const [featuredImage, setFeaturedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ================= FETCH BLOG ================= */
  useEffect(() => {
    if (!id) return;

    fetch(`/api/blogs/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setTitle(data.title);
        setInitialContent(data.content);
        setImagePreview(data.featuredImage || null);
      });
  }, [id]);

  /* ================= UPDATE BLOG ================= */
  const updateBlog = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!editorDataRef.current) {
      toast.error("Editor content missing");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append(
      "content",
      JSON.stringify(editorDataRef.current)
    );

    if (featuredImage) {
      formData.append("featuredImage", featuredImage);
    }

    try {
      const res = await fetch(`/api/blogs/${id}`, {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        localStorage.removeItem(`blog-draft-${id}`);
        toast.success("Blog updated");
        router.push("/admin/blogs");
      } else {
        toast.error("Update failed");
      }
    } catch (err) {
      toast.error("Something went wrong");
    }

    setLoading(false);
  };

  if (!initialContent) {
    return <p style={{ textAlign: "center" }}>Loading editor...</p>;
  }

  return (
    <div style={{ maxWidth: 800, margin: "40px auto" }}>
      <h1>Edit Blog</h1>

      {/* Title */}
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

      {/* ⭐ Featured Image */}
      <div style={{ marginBottom: 24 }}>
        <h3>Featured Image</h3>

        <ImageUploader onUpload={(url) => {
          setFeaturedImage(url);
          setImagePreview(url);
        }} />

        {imagePreview && (
          <img
            src={imagePreview}
            alt="Preview"
            style={{
              width: "100%",
              maxHeight: 300,
              objectFit: "cover",
              marginTop: 12,
              borderRadius: 8,
            }}
          />
        )}
      </div>

      {/* Editor */}
      <BlogEditor
        blogId={id}
        apiData={initialContent}
        onChangeData={(data) => {
          editorDataRef.current = data;
        }}
      />

      {/* Buttons */}
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
          }}
        >
          Preview
        </button>
      </div>
    </div>
  );
}
