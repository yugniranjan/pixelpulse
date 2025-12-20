"use client";

import { useEffect, useRef } from "react";
import EditorJS from "@editorjs/editorjs";
import Header from "@editorjs/header";
import List from "@editorjs/list";
import Quote from "@editorjs/quote";
import ImageTool from "@editorjs/image";
import Embed from "@editorjs/embed";
import Table from "@editorjs/table";
import CodeTool from "@editorjs/code";
import Marker from "@editorjs/marker";
import LinkTool from "@editorjs/link";

export default function BlogEditor({ onChange , value = null}) {
  
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current) return;

    const editor = new EditorJS({
      data: value || undefined,
      holder: "editorjs",
      autofocus: true,
      placeholder: "Start writing your blog here...",
      tools: {
        header: {
          class: Header,
          inlineToolbar: ["bold", "italic", "link", "marker"],
        },
        list: {
          class: List,
          inlineToolbar: ["bold", "italic", "link"],
        },
        quote: {
          class: Quote,
          inlineToolbar: ["bold", "italic", "link"],
          config: {
            quotePlaceholder: "Enter a quote",
            captionPlaceholder: "Quote author",
          },
        },
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
                return {
                  success: 1,
                  file: { url: data.url },
                };
              },
            },
          },
        },
        embed: {
          class: Embed,
          inlineToolbar: false,
          config: {
            services: {
              youtube: true,
              twitter: true,
              instagram: true,
            },
          },
        },
        table: Table,
        code: {
          class: CodeTool,
          inlineToolbar: true,
        },
        marker: {
          class: Marker,
          shortcut: "CMD+SHIFT+M",
        },
        linkTool: {
          class: LinkTool,
          inlineToolbar: true,
        },
      },
      inlineToolbar: true,
      onChange: async (api) => {
        const content = await api.saver.save();
        onChange(content);
      },
    });

    editorRef.current = editor;

    return () => {
      if (editorRef.current?.destroy) {
        editorRef.current.destroy();
      }
      editorRef.current = null;
    };
  }, [value]);

  return (
    <div
      id="editorjs"
      className="border border-gray-300 p-4 rounded-md min-h-[500px] bg-white"
    />
  );
}
