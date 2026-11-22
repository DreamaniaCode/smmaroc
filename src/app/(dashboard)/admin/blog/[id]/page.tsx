"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BlogPostEditor } from "@/components/design/BlogPostEditor";

export default function EditBlogPostPage() {
  const params = useParams();
  const id = params?.id as string;
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const res = await fetch(`/api/blog/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Article introuvable");
        setPost(data.post);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Chargement de l&apos;article...
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="p-6 rounded-xl bg-red-50 text-red-700 text-sm">
        {error || "Article introuvable."}
      </div>
    );
  }

  return <BlogPostEditor initialData={post} isEdit={true} />;
}
