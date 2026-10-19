import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, BookOpen, Eye, EyeOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  author_name: string;
  meta_title: string | null;
  meta_description: string | null;
  tags: string[] | null;
  category: string | null;
  reading_minutes: number | null;
  published: boolean;
  published_at: string | null;
  updated_at: string;
}

const emptyForm = {
  slug: "",
  title: "",
  excerpt: "",
  content: "",
  cover_image_url: "",
  author_name: "Optimum Pharmaceuticals HLB Team",
  meta_title: "",
  meta_description: "",
  tags: "",
  category: "",
  reading_minutes: 3,
  published: false,
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

const AdminBlogPosts = () => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["admin-blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as BlogPost[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: typeof form & { id?: string }) => {
      const tagsArr = payload.tags
        ? payload.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [];
      const row = {
        slug: payload.slug || slugify(payload.title),
        title: payload.title,
        excerpt: payload.excerpt || null,
        content: payload.content,
        cover_image_url: payload.cover_image_url || null,
        author_name: payload.author_name || "Optimum Pharmaceuticals HLB Team",
        meta_title: payload.meta_title || null,
        meta_description: payload.meta_description || null,
        tags: tagsArr,
        category: payload.category || null,
        reading_minutes: payload.reading_minutes || 3,
        published: payload.published,
      };
      if (payload.id) {
        const { error } = await supabase.from("blog_posts").update(row).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("blog_posts").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      toast.success(editing ? "Post updated!" : "Post created!");
      resetForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase.from("blog_posts").update({ published }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] }),
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      toast.success("Post deleted!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const resetForm = () => {
    setEditing(null);
    setIsAdding(false);
    setForm(emptyForm);
  };

  const startEdit = (post: BlogPost) => {
    setEditing(post);
    setIsAdding(true);
    setForm({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt || "",
      content: post.content || "",
      cover_image_url: post.cover_image_url || "",
      author_name: post.author_name || "Optimum Pharmaceuticals HLB Team",
      meta_title: post.meta_title || "",
      meta_description: post.meta_description || "",
      tags: (post.tags || []).join(", "),
      category: post.category || "",
      reading_minutes: post.reading_minutes || 3,
      published: post.published,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Title is required");
    if (!form.content.trim()) return toast.error("Content is required");
    saveMutation.mutate({ ...form, id: editing?.id });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen size={20} className="text-primary" />
          <h3 className="font-bold text-foreground">Blog Posts ({posts.length})</h3>
        </div>
        {!isAdding && (
          <button
            onClick={() => {
              setIsAdding(true);
              setEditing(null);
              setForm(emptyForm);
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold gradient-primary text-primary-foreground rounded-2xl shadow-ios hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={14} /> New Post
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-card rounded-2xl shadow-ios p-4 space-y-3">
          <h4 className="text-sm font-bold text-foreground">{editing ? "Edit Post" : "New Blog Post"}</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Title *</label>
              <Input
                value={form.title}
                onChange={(e) => {
                  const t = e.target.value;
                  setForm((f) => ({ ...f, title: t, slug: f.slug || slugify(t) }));
                }}
                placeholder="Post title"
                className="h-10 rounded-xl text-sm"
                required
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">URL Slug</label>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                placeholder="auto-generated"
                className="h-10 rounded-xl text-sm font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Excerpt (short preview)</label>
            <Textarea
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              placeholder="One-line summary"
              className="rounded-xl text-sm min-h-16"
              maxLength={250}
            />
          </div>

          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">
              Content (HTML allowed: &lt;h2&gt;, &lt;p&gt;, &lt;a&gt;, &lt;ul&gt;, &lt;img&gt;)
            </label>
            <Textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="<p>Full article content…</p>"
              className="rounded-xl text-sm font-mono min-h-48"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Cover Image URL</label>
              <Input
                value={form.cover_image_url}
                onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })}
                placeholder="https://…"
                className="h-10 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Author Name</label>
              <Input
                value={form.author_name}
                onChange={(e) => setForm({ ...form, author_name: e.target.value })}
                className="h-10 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Category</label>
              <Input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Wellness, Nutrition…"
                className="h-10 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Tags (comma-separated)</label>
              <Input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="diabetes, prevention"
                className="h-10 rounded-xl text-sm"
              />
            </div>
            <div className="w-32">
              <label className="text-[10px] text-muted-foreground mb-1 block">Reading min</label>
              <Input
                type="number"
                value={form.reading_minutes}
                onChange={(e) => setForm({ ...form, reading_minutes: parseInt(e.target.value) || 3 })}
                className="h-10 rounded-xl text-sm"
              />
            </div>
          </div>

          <details className="bg-secondary/40 rounded-xl p-3">
            <summary className="text-xs font-semibold cursor-pointer">SEO Meta (optional)</summary>
            <div className="space-y-2 mt-2">
              <Input
                value={form.meta_title}
                onChange={(e) => setForm({ ...form, meta_title: e.target.value })}
                placeholder="Meta title (≤ 60 chars)"
                className="h-10 rounded-xl text-sm"
                maxLength={60}
              />
              <Textarea
                value={form.meta_description}
                onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
                placeholder="Meta description (≤ 160 chars)"
                className="rounded-xl text-sm min-h-16"
                maxLength={160}
              />
            </div>
          </details>

          <div className="flex items-center gap-2">
            <Switch
              checked={form.published}
              onCheckedChange={(v) => setForm({ ...form, published: v })}
            />
            <span className="text-xs text-foreground font-medium">
              {form.published ? "Published (live)" : "Draft (hidden)"}
            </span>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold gradient-accent text-accent-foreground rounded-xl shadow-ios disabled:opacity-50"
            >
              {saveMutation.isPending && <Loader2 className="animate-spin" size={14} />}
              {editing ? "Update" : "Save"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-xs font-medium text-muted-foreground bg-secondary rounded-xl"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-card rounded-2xl shadow-ios overflow-hidden divide-y divide-border/40">
        {posts.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">No blog posts yet</p>
        )}
        {posts.map((post) => (
          <div key={post.id} className="flex items-center gap-3 px-4 py-3">
            {post.cover_image_url ? (
              <img
                src={post.cover_image_url}
                alt=""
                className="w-12 h-12 rounded-lg object-cover shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <BookOpen size={16} className="text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground truncate">{post.title}</p>
                {post.published ? (
                  <Eye size={12} className="text-primary shrink-0" />
                ) : (
                  <EyeOff size={12} className="text-muted-foreground shrink-0" />
                )}
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                /{post.slug} · {post.author_name}
                {post.published_at && ` · ${new Date(post.published_at).toLocaleDateString()}`}
              </p>
            </div>
            <Switch
              checked={post.published}
              onCheckedChange={(published) => togglePublishMutation.mutate({ id: post.id, published })}
              className="shrink-0"
            />
            <button
              onClick={() => startEdit(post)}
              className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
            >
              <Pencil size={14} className="text-muted-foreground" />
            </button>
            <button
              onClick={() => {
                if (confirm("Delete this post?")) deleteMutation.mutate(post.id);
              }}
              className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
            >
              <Trash2 size={14} className="text-destructive" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminBlogPosts;
