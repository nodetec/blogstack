"use client";
import "@uiw/react-markdown-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import dynamic from "next/dynamic";
import { useContext, useEffect, useState } from "react";
import { BlogContext } from "../context/blog-provider";

const MarkdownEditor = dynamic(
  () => import("@uiw/react-markdown-editor").then((mod) => mod.default),
  { ssr: false }
);

const WritePage = () => {
  // @ts-ignore
  const { blog, setBlog } = useContext(BlogContext);

  useEffect(() => {
    return () => {
      setBlog({
        title: "",
        summary: null,
        content: "",
        image: null,
        identifier: null,
        publishedAt: null,
        titleValid: true,
        contentValid: true,
      });
    };
  }, [setBlog]);

  const handleTitleChange = (evn: any) => {
    setBlog({ ...blog, title: evn.target.value, titleValid: true });
  };

  const handleContentChange = (evn: any) => {
    setBlog({ ...blog, content: evn, contentValid: true });
  };

  return (
    <div className="mt-8 shadow-editor rounded-md overflow-hidden">
      <input
        className="w-full p-4 text-lg font-bold focus:outline-none"
        placeholder="Title..."
        style={{ backgroundColor: "#f6f8fa" }}
        value={blog.title}
        onChange={handleTitleChange}
      />
      <MarkdownEditor
        className="h-[75vh]"
        value={blog.content}
        onChange={handleContentChange}
      />
    </div>
  );
};

export default WritePage;
