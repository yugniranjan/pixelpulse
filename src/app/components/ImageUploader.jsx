"use client";

import { useState } from "react";

export default function ImageUploader({ onUpload }) {
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload-image", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setLoading(false);

    if (data.url) {
      onUpload(data.url); // editor/firestore ke liye
    }
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleUpload} />
      {loading && <p>Uploading...</p>}
    </div>
  );
}
