"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import ImageUploader from "@/components/ImageUploader";

const BlogEditor = dynamic(() => import("@/components/Editor"), {
  ssr: false,
});

export default function CreateBlog() {
  const router = useRouter();

  const editorDataRef = useRef(null);
  const [title, setTitle] = useState("");
  const [featuredImage, setFeaturedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  // const handleImageChange = (e) => {
  //   const file = e.target.files[0];
  //   if (!file) return;

  //   ImageUploader(file).then((url) => {
  //     setFeaturedImage(url);
  //     setImagePreview(url);
  //   });

  //   // setFeaturedImage(file);


  //   // const reader = new FileReader();
  //   // reader.onloadend = () => {
  //   //   setImagePreview(reader.result);
  //   // };
  //   // reader.readAsDataURL(file);
  // };

  const publishBlog = async () => {
    if (!title.trim()) {
      toast.error("Please enter blog title");
      return;
    }

    if (!editorDataRef.current) {
      toast.error("Please write some content");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", JSON.stringify(editorDataRef.current));
    if (featuredImage) {
      formData.append("featuredImage", featuredImage);
    }

    try {
      const res = await fetch("/api/create-blog", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        localStorage.removeItem("blog-draft-new");
        toast.success("Blog published");
        router.push("/admin/blogs");
      } else {
        toast.error("Failed to publish blog");
      }
    } catch (err) {
      toast.error("Something went wrong");
    }

    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 800, margin: "40px auto" }}>
      <h1>Admin Blog Editor</h1>

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

      {/* ⭐ Featured Image Section */}
      <div style={{ marginBottom: 24 }}>
        <h3>Featured Image</h3>

        {/* <input type="file" accept="image/*" onChange={ImageUploader} /> */}
        <ImageUploader
          onUpload={(url) => {
            setFeaturedImage(url);
            setImagePreview(url);
          }}
        />

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
        onChangeData={(data) => {
          editorDataRef.current = data;
        }}
      />

      {/* Buttons */}
      <div style={{ display: "flex", gap: 16, marginTop: 20 }}>
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
          }}
        >
          Preview
        </button>
      </div>
    </div>
  );
}
