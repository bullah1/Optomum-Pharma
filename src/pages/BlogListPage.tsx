import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PageTopBar from "@/components/PageTopBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { Loader2, BookOpen, Calendar, Clock } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

const BlogListPage = () => {
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["blog-posts-public"],
    queryFn: async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("slug,title,excerpt,cover_image_url,author_name,published_at,reading_minutes,category")
        .eq("published", true)
        .order("published_at", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  useSEO(
    {
      title: "Health Blog — Trusted Medical Articles | Optimum Pharmaceuticals HLB",
      description:
        "Expert-reviewed health articles, medicine guides, nutrition, and wellness tips from Optimum Pharmaceuticals HLB Bangladesh. বিজ্ঞানসম্মত স্বাস্থ্য পরামর্শ।",
      canonical: "/blog",
    },
    posts.length > 0
      ? {
          id: "blog-list",
          data: {
            "@context": "https://schema.org",
            "@type": "Blog",
            name: "Optimum Pharmaceuticals HLB Health Blog",
            blogPost: posts.slice(0, 20).map((p: any) => ({
              "@type": "BlogPosting",
              headline: p.title,
              datePublished: p.published_at,
              author: { "@type": "Person", name: p.author_name },
              url: `https://optimumpharmahlb.com/blog/${p.slug}`,
            })),
          },
        }
      : undefined
  );

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <PageTopBar title="Health Blog" />
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        <header className="space-y-1">
          <h1 className="text-xl font-bold text-foreground">Health &amp; Wellness Blog</h1>
          <p className="text-sm text-muted-foreground">
            Expert-reviewed articles on medicines, nutrition, and preventive care.
          </p>
        </header>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <BookOpen size={40} className="mx-auto mb-3 opacity-40" />
            <p>No articles published yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post: any) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="block bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
              >
                {post.cover_image_url && (
                  <div className="aspect-[16/9] bg-muted overflow-hidden">
                    <img
                      src={post.cover_image_url}
                      alt={post.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4 space-y-2">
                  {post.category && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full inline-block">
                      {post.category}
                    </span>
                  )}
                  <h2 className="text-base font-bold text-foreground leading-snug">{post.title}</h2>
                  {post.excerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                  )}
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1">
                    <span>By {post.author_name}</span>
                    {post.published_at && (
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {new Date(post.published_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {post.reading_minutes || 3} min
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <MobileBottomNav />
    </div>
  );
};

export default BlogListPage;
