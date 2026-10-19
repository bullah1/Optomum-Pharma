import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PageTopBar from "@/components/PageTopBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { Loader2, Calendar, Clock, User } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      return data;
    },
    enabled: !!slug,
  });

  useSEO(
    post
      ? {
          title: post.meta_title || `${post.title} | Optimum Pharmaceuticals HLB Blog`,
          description:
            post.meta_description ||
            post.excerpt ||
            `Read "${post.title}" on the Optimum Pharmaceuticals HLB health blog.`,
          canonical: `/blog/${post.slug}`,
        }
      : { title: "Loading… | Optimum Pharmaceuticals HLB Blog", description: "" },
    post
      ? {
          id: "blog-article",
          data: {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.meta_description || post.excerpt,
            image: post.cover_image_url ? [post.cover_image_url] : undefined,
            datePublished: post.published_at,
            dateModified: post.updated_at || post.published_at,
            author: { "@type": "Person", name: post.author_name },
            publisher: {
              "@type": "Organization",
              name: "Optimum Pharmaceuticals HLB",
              logo: {
                "@type": "ImageObject",
                url: "https://optimumpharmahlb.com/images/optimum-logo.jpg",
              },
            },
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `https://optimumpharmahlb.com/blog/${post.slug}`,
            },
          },
        }
      : undefined
  );

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <PageTopBar title="Health Blog" />
      <div className="max-w-2xl mx-auto px-4 py-4">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        ) : !post ? (
          <div className="text-center py-16 space-y-3">
            <p className="text-muted-foreground">Article not found.</p>
            <Link to="/blog" className="text-primary text-sm font-medium underline">
              Back to blog
            </Link>
          </div>
        ) : (
          <article className="space-y-4">
            <nav className="text-xs text-muted-foreground">
              <Link to="/" className="hover:text-foreground">Home</Link>
              {" / "}
              <Link to="/blog" className="hover:text-foreground">Blog</Link>
            </nav>

            {post.category && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full inline-block">
                {post.category}
              </span>
            )}

            <h1 className="text-2xl font-bold text-foreground leading-tight">{post.title}</h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <User size={12} />
                {post.author_name}
              </span>
              {post.published_at && (
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date(post.published_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {post.reading_minutes || 3} min read
              </span>
            </div>

            {post.cover_image_url && (
              <div className="aspect-[16/9] bg-muted rounded-2xl overflow-hidden">
                <img
                  src={post.cover_image_url}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {post.excerpt && (
              <p className="text-base text-muted-foreground italic border-l-2 border-primary/40 pl-3">
                {post.excerpt}
              </p>
            )}

            <div
              className="prose prose-sm max-w-none text-foreground leading-relaxed [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-5 [&_h3]:font-semibold [&_p]:my-3 [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_img]:rounded-xl [&_img]:my-3"
              dangerouslySetInnerHTML={{ __html: post.content || "" }}
            />

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                {post.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="text-[11px] font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-md"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {post.updated_at && post.updated_at !== post.published_at && (
              <p className="text-[11px] text-muted-foreground pt-2">
                Last updated:{" "}
                {new Date(post.updated_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
          </article>
        )}
      </div>
      <MobileBottomNav />
    </div>
  );
};

export default BlogPostPage;
