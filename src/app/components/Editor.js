"use client";

import { useEffect, useRef } from "react";

const getDraftKey = (blogId) =>
  blogId ? `blog-draft-${blogId}` : "blog-draft-new";

export default function BlogEditor({
  blogId = null,
  apiData = null,
  onReady,
  onChangeData,
}) {
  const editorRef = useRef(null);
  const dataRef = useRef(null);
  const initialised = useRef(false);
  const holderId = "editorjs";

  // ================= INIT + LOAD DATA =================
  useEffect(() => {
    let mounted = true;

    async function initEditor() {
      if (editorRef.current) return;

      const EditorJS = (await import("@editorjs/editorjs")).default;
      const Header = (await import("@editorjs/header")).default;
      const List = (await import("@editorjs/list")).default;
      const Quote = (await import("@editorjs/quote")).default;
      const ImageTool = (await import("@editorjs/image")).default;
      const Embed = (await import("@editorjs/embed")).default;
      const Table = (await import("@editorjs/table")).default;
      const CodeTool = (await import("@editorjs/code")).default;
      const Marker = (await import("@editorjs/marker")).default;
      const LinkTool = (await import("@editorjs/link")).default;

      if (!mounted) return;

      const editor = new EditorJS({
        holder: holderId,
        autofocus: true,
        placeholder: "Start writing your blog...",

        tools: {
          header: Header,
          list: List,
          quote: Quote,
          table: Table,
          code: CodeTool,
          marker: Marker,
          linkTool: LinkTool,
          embed: Embed,
          image: {
            class: ImageTool,
            config: {
              uploader: {
                async uploadByFile(file) {
                  const formData = new FormData();
                  formData.append("file", file);

                  const res = await fetch("/api/upload-image", {
                    method: "POST",
                    body: formData,
                  });

                  const data = await res.json();
                  return { success: 1, file: { url: data.url } };
                },
              },
            },
          },
        },

        onChange: async (api) => {
          const savedData = await api.saver.save();
          dataRef.current = savedData;
          onChangeData?.(savedData);
        },
      });

      editorRef.current = editor;

      // 🔥 LOAD DATA AFTER READY
      editor.isReady.then(() => {
        if (initialised.current) return;

        const draftKey = getDraftKey(blogId);
        const draft = localStorage.getItem(draftKey);

        if (draft) {
          editor.render(JSON.parse(draft));
        } else if (apiData) {
          editor.render(apiData);
        }

        initialised.current = true;
        onReady?.();
      });
    }

    initEditor();

    return () => {
      mounted = false;
      editorRef.current?.destroy?.();
      editorRef.current = null;
    };
  }, []); // 👈 IMPORTANT: EMPTY DEPENDENCY

  // ================= AUTOSAVE =================
  useEffect(() => {
    const draftKey = getDraftKey(blogId);

    const interval = setInterval(() => {
      if (!dataRef.current) return;
      localStorage.setItem(draftKey, JSON.stringify(dataRef.current));
    }, 8000);

    return () => clearInterval(interval);
  }, [blogId]);

  return (
    <div
      id={holderId}
      className="border p-4 rounded-md min-h-[500px] bg-white"
    />
  );
}
