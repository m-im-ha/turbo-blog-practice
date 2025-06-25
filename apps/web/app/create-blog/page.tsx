"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelect } from "@/MultiSelect";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const allTags = [
  "javascript",
  "typescript",
  "python",
  "java",
  "csharp",
  "go",
  "rust",
  "ai",
  "machine-learning",
  "deep-learning",
  "nlp",
  "react",
  "vue",
  "angular",
  "svelte",
  "nextjs",
  "tailwindcss",
  "web-development",
  "backend",
  "frontend",
  "data-science",
];

export default function CreateBlog() {
  const { status } = useSession();
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleCreateBlog() {
    // console.log({ title, tags, content });
    // try {
    //   const res = await fetch("/api/blogs/create", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ title, tags, content }),
    //   });
    //   const data = await res.json();
    //   if (!res.ok) {
    //     throw new Error(data.error || "Failed to create blog.");
    //   }
    //   router.push("/");
    // } catch (err: any) {
    //   setError(err.message);
    // }
    console.log({ title, tags, content });
  }

  if (error) {
    return <p className="text-center text-red-500 mt-4">{error}</p>;
  }

  if (status === "loading") {
    return (
      <p className="text-4xl text-amber-500 text-center mt-10">Loading...</p>
    );
  }

  return (
    <div className="min-h-screen text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Cover Image Button */}
        <Button
          variant="outline"
          className="mb-6 bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
        >
          Add a cover image
        </Button>

        {/* Title Input */}
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New post title here..."
          className="text-4xl font-bold bg-transparent border-none text-gray-600 placeholder-gray-100 p-0 mb-4 outline-none my-custom-input"
        />

        {/* Tags Input */}
        <div className="my-8">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Tags (select up to 4)
          </label>
          <MultiSelect
            options={allTags}
            selected={tags}
            onChange={setTags}
            max={4}
          />
        </div>

        {/* Content Textarea */}
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your post content here..."
          className="min-h-[200px] border-none text-gray-900 placeholder-gray-500 p-0 resize-none my-custom-input text-lg leading-relaxed"
        />

        {/* Publish Button */}
        <div className="mt-8">
          <Button
            onClick={handleCreateBlog}
            className="px-8 py-2 bg-blue-600 hover:bg-blue-700"
            disabled={!title.trim() || !content.trim()}
          >
            Publish
          </Button>
        </div>
      </div>
    </div>
  );
}
